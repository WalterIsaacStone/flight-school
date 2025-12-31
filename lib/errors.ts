// =============================================================================
// Centralized Error Handling
// =============================================================================

import { ZodError } from "zod";

// -----------------------------------------------------------------------------
// AppError - Standardized Error Shape
// -----------------------------------------------------------------------------
export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "NETWORK_ERROR"
  | "DATABASE_ERROR"
  | "UNKNOWN_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly context?: Record<string, unknown>;
  readonly originalError?: unknown;

  constructor(
    message: string,
    code: AppErrorCode = "UNKNOWN_ERROR",
    options?: {
      statusCode?: number;
      context?: Record<string, unknown>;
      originalError?: unknown;
    }
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = options?.statusCode ?? getStatusCode(code);
    this.context = options?.context;
    this.originalError = options?.originalError;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

function getStatusCode(code: AppErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "NETWORK_ERROR":
    case "DATABASE_ERROR":
    case "UNKNOWN_ERROR":
    default:
      return 500;
  }
}

// -----------------------------------------------------------------------------
// Error Normalization
// -----------------------------------------------------------------------------
export function normalizeError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Zod validation error
  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    return new AppError(
      `Validation failed: ${messages.join(", ")}`,
      "VALIDATION_ERROR",
      { originalError: error, context: { issues: error.errors } }
    );
  }

  // Supabase/Postgres error patterns
  if (isSupabaseError(error)) {
    const supaError = error as { message: string; code?: string; details?: string };
    
    // Foreign key violation
    if (supaError.code === "23503") {
      return new AppError(
        "This record is referenced by other data",
        "CONFLICT",
        { originalError: error }
      );
    }
    
    // Unique violation
    if (supaError.code === "23505") {
      return new AppError(
        "A record with this value already exists",
        "CONFLICT",
        { originalError: error }
      );
    }
    
    // RLS violation
    if (supaError.code === "42501" || supaError.message?.includes("RLS")) {
      return new AppError(
        "You don't have permission to perform this action",
        "FORBIDDEN",
        { originalError: error }
      );
    }

    // Auth errors
    if (supaError.message?.includes("JWT") || supaError.message?.includes("token")) {
      return new AppError(
        "Your session has expired. Please sign in again.",
        "UNAUTHORIZED",
        { originalError: error }
      );
    }

    return new AppError(
      supaError.message || "Database operation failed",
      "DATABASE_ERROR",
      { originalError: error }
    );
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return new AppError(
      "Network error. Please check your connection.",
      "NETWORK_ERROR",
      { originalError: error }
    );
  }

  // Generic Error
  if (error instanceof Error) {
    return new AppError(error.message, "UNKNOWN_ERROR", { originalError: error });
  }

  // Unknown
  return new AppError(
    "An unexpected error occurred",
    "UNKNOWN_ERROR",
    { originalError: error }
  );
}

function isSupabaseError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

// -----------------------------------------------------------------------------
// User-Friendly Messages
// -----------------------------------------------------------------------------
export function getUserMessage(error: AppError): string {
  switch (error.code) {
    case "VALIDATION_ERROR":
      return error.message;
    case "NOT_FOUND":
      return "The requested item could not be found.";
    case "UNAUTHORIZED":
      return "Please sign in to continue.";
    case "FORBIDDEN":
      return "You don't have permission to perform this action.";
    case "CONFLICT":
      return error.message;
    case "NETWORK_ERROR":
      return "Network error. Please check your connection and try again.";
    case "DATABASE_ERROR":
      return "An error occurred while saving. Please try again.";
    case "UNKNOWN_ERROR":
    default:
      return "Something went wrong. Please try again.";
  }
}

// -----------------------------------------------------------------------------
// Structured Logging
// -----------------------------------------------------------------------------
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(this.sanitize(context))}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  // Remove PII and sensitive data
  private sanitize(context: LogContext): LogContext {
    const sanitized = { ...context };
    
    // Remove potential PII fields
    const piiFields = ["email", "phone", "password", "token", "apiKey", "secret"];
    for (const field of piiFields) {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    }
    
    return sanitized;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, error?: unknown, context?: LogContext) {
    const appError = error ? normalizeError(error) : null;
    
    const logContext: LogContext = {
      ...context,
      ...(appError && {
        errorCode: appError.code,
        errorMessage: appError.message,
      }),
    };

    console.error(this.formatMessage("error", message, logContext));

    // In production, you would send to Sentry/DataDog/etc:
    // if (!this.isDev && appError) {
    //   Sentry.captureException(appError.originalError || appError, {
    //     extra: logContext,
    //   });
    // }
  }

  // Log mutation actions for audit trail
  mutation(action: string, entityType: string, entityId: string, context?: LogContext) {
    this.info(`Mutation: ${action}`, {
      action,
      entityType,
      entityId,
      ...context,
    });
  }
}

export const logger = new Logger();

// -----------------------------------------------------------------------------
// handleError - Main Error Handler
// -----------------------------------------------------------------------------
export function handleError(
  error: unknown,
  context?: { action?: string; showToast?: (msg: string, type: "error") => void }
): AppError {
  const appError = normalizeError(error);
  
  // Log the error
  logger.error(context?.action || "Operation failed", error, {
    action: context?.action,
  });

  // Show toast if provided
  if (context?.showToast) {
    context.showToast(getUserMessage(appError), "error");
  }

  return appError;
}
