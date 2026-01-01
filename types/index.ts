// =============================================================================
// Type Definitions
// =============================================================================
// Re-export validated types from schemas (single source of truth)
// Add UI-only types that don't need runtime validation

// Domain types (validated by Zod)
export type {
  Line,
  LineWithTag,
  LineTag,
  CreateLineTagInput,
  Student,
  CreateStudentInput,
  CourseType,
  CreateCourseTypeInput,
  BillingTag,
  CreateBillingTagInput,
  StudentTag,
  Booking,
  BookingWithStudent,
  CreateBookingInput,
  ActionItem,
  CreateActionInput,
  BookingHistoryItem,
  BookingFormData,
} from "@/lib/schemas";

// Re-export schemas for validation
export {
  LineSchema,
  LineArraySchema,
  LineWithTagSchema,
  LineWithTagArraySchema,
  LineTagSchema,
  LineTagArraySchema,
  CreateLineTagSchema,
  StudentSchema,
  StudentArraySchema,
  CreateStudentSchema,
  CourseTypeSchema,
  CourseTypeArraySchema,
  CreateCourseTypeSchema,
  BillingTagSchema,
  BillingTagArraySchema,
  CreateBillingTagSchema,
  StudentTagSchema,
  StudentTagArraySchema,
  BookingSchema,
  BookingWithStudentSchema,
  BookingArraySchema,
  CreateBookingSchema,
  ActionItemSchema,
  ActionItemArraySchema,
  CreateActionSchema,
  BookingHistoryItemSchema,
  BookingHistoryArraySchema,
  BookingFormSchema,
} from "@/lib/schemas";

// =============================================================================
// UI State Types (no runtime validation needed)
// =============================================================================

export type ViewMode = "week" | "month";

export type PanelMode = "create" | "edit";

export type DrawerTab = "student" | "tags" | "actions" | "history";

export type FilterState = {
  lineId: "all" | string;
  courseType: string;
  billingTag: string;
};

export type TodoFilter = "all" | "open" | "done";

// =============================================================================
// Service Types
// =============================================================================

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// =============================================================================
// Form State Types (for controlled inputs before validation)
// =============================================================================

export type NewStudentFormState = {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
};
