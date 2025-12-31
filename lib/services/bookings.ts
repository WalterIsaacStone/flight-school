import { supabase } from "@/lib/supabase/client";
import { BookingArraySchema } from "@/lib/schemas";
import { logger, handleError } from "@/lib/errors";
import { normalizeDateString } from "@/lib/utils/dates";
import type { BookingWithStudent } from "@/lib/schemas";

// =============================================================================
// Bookings Service - With Validation, Pagination & Concurrency Control
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// -----------------------------------------------------------------------------
// Fetch All Bookings (simple version for hooks - with limit for safety)
// -----------------------------------------------------------------------------
export async function fetchBookings(): Promise<ServiceResult<BookingWithStudent[]>> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, line_id, student_id, course_type, start_date, end_date, billing_tag, note, updated_at, students(full_name, email)"
      )
      .order("start_date", { ascending: true })
      .limit(1000); // Safety limit - use fetchBookingsInRange for larger datasets

    if (error) {
      logger.error("Error fetching bookings", error, { action: "fetchBookings" });
      return { data: null, error: error.message };
    }

    const normalized = (data ?? []).map((b) => {
      const record = b as Record<string, unknown>;
      const studentsField = record.students;

      return {
        id: record.id as string,
        line_id: record.line_id as string,
        student_id: record.student_id as string,
        course_type: record.course_type as string,
        start_date: normalizeDateString(record.start_date as string) ?? "",
        end_date: normalizeDateString(record.end_date as string) ?? "",
        billing_tag: record.billing_tag as string | null,
        note: record.note as string | null,
        updated_at: record.updated_at as string | undefined,
        students: Array.isArray(studentsField)
          ? (studentsField[0] as { full_name: string | null; email?: string | null } | null) ?? null
          : (studentsField as { full_name: string | null; email?: string | null } | null) ?? null,
      };
    });

    // Validate with Zod (safe parse - don't crash on invalid data)
    const parsed = BookingArraySchema.safeParse(normalized);
    
    if (!parsed.success) {
      logger.warn("Booking data validation warnings", {
        action: "fetchBookings",
        issues: parsed.error.issues.slice(0, 5),
      });
    }

    return { data: normalized, error: null };
  } catch (err) {
    const appError = handleError(err, { action: "fetchBookings" });
    return { data: null, error: appError.message };
  }
}

// -----------------------------------------------------------------------------
// Fetch Bookings in Date Range (for calendar view)
// -----------------------------------------------------------------------------
export async function fetchBookingsInRange(
  startDate: string,
  endDate: string
): Promise<ServiceResult<BookingWithStudent[]>> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, line_id, student_id, course_type, start_date, end_date, billing_tag, note, updated_at, students(full_name, email)"
      )
      .lte("start_date", endDate)
      .gte("end_date", startDate)
      .order("start_date", { ascending: true })
      .limit(500); // Safety limit

    if (error) {
      logger.error("Error fetching bookings in range", error, { action: "fetchBookingsInRange" });
      return { data: null, error: error.message };
    }

    const normalized = (data ?? []).map((b) => {
      const record = b as Record<string, unknown>;
      const studentsField = record.students;

      return {
        id: record.id as string,
        line_id: record.line_id as string,
        student_id: record.student_id as string,
        course_type: record.course_type as string,
        start_date: normalizeDateString(record.start_date as string) ?? "",
        end_date: normalizeDateString(record.end_date as string) ?? "",
        billing_tag: record.billing_tag as string | null,
        note: record.note as string | null,
        updated_at: record.updated_at as string | undefined,
        students: Array.isArray(studentsField)
          ? (studentsField[0] as { full_name: string | null; email?: string | null } | null) ?? null
          : (studentsField as { full_name: string | null; email?: string | null } | null) ?? null,
      };
    });

    return { data: normalized, error: null };
  } catch (err) {
    const appError = handleError(err, { action: "fetchBookingsInRange" });
    return { data: null, error: appError.message };
  }
}

// -----------------------------------------------------------------------------
// Create Booking
// -----------------------------------------------------------------------------
export type CreateBookingPayload = {
  line_id: string;
  student_id: string;
  course_type: string;
  start_date: string;
  end_date: string;
  billing_tag: string | null;
  note: string | null;
};

export async function createBooking(
  payload: CreateBookingPayload
): Promise<ServiceResult<{ id: string; updated_at: string }>> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .insert(payload)
      .select("id, updated_at")
      .single();

    if (error) {
      logger.error("Error creating booking", error, { action: "createBooking" });
      return { data: null, error: error.message };
    }

    logger.mutation("create", "booking", data.id);
    return { data: data as { id: string; updated_at: string }, error: null };
  } catch (err) {
    const appError = handleError(err, { action: "createBooking" });
    return { data: null, error: appError.message };
  }
}

// -----------------------------------------------------------------------------
// Update Booking (with optimistic concurrency control)
// -----------------------------------------------------------------------------
export type UpdateBookingPayload = Partial<CreateBookingPayload>;

export async function updateBooking(
  id: string,
  payload: UpdateBookingPayload,
  expectedUpdatedAt?: string // For optimistic concurrency control
): Promise<ServiceResult<{ id: string; updated_at: string }>> {
  try {
    // Build the update query
    let query = supabase
      .from("bookings")
      .update(payload)
      .eq("id", id);

    // If we have an expected updated_at, use it for concurrency control
    if (expectedUpdatedAt) {
      query = query.eq("updated_at", expectedUpdatedAt);
    }

    const { data, error, count } = await query
      .select("id, updated_at")
      .single();

    if (error) {
      // Check if this might be a concurrency conflict
      if (error.code === "PGRST116" && expectedUpdatedAt) {
        // No rows returned - likely a concurrent modification
        return { 
          data: null, 
          error: "This booking was modified by someone else. Please refresh and try again." 
        };
      }
      logger.error("Error updating booking", error, { action: "updateBooking", entityId: id });
      return { data: null, error: error.message };
    }

    logger.mutation("update", "booking", id);
    return { data: data as { id: string; updated_at: string }, error: null };
  } catch (err) {
    const appError = handleError(err, { action: "updateBooking" });
    return { data: null, error: appError.message };
  }
}

// -----------------------------------------------------------------------------
// Delete Booking (with cascade cleanup)
// -----------------------------------------------------------------------------
export async function deleteBooking(id: string): Promise<ServiceResult<null>> {
  try {
    // First delete associated actions
    const { error: actionsError } = await supabase
      .from("actions")
      .delete()
      .eq("booking_id", id);

    if (actionsError) {
      logger.error("Error deleting booking actions", actionsError, { 
        action: "deleteBooking", 
        entityId: id 
      });
      return { data: null, error: actionsError.message };
    }

    // Then delete booking history
    const { error: historyError } = await supabase
      .from("booking_history")
      .delete()
      .eq("booking_id", id);

    if (historyError) {
      // Log but continue - history is non-critical
      logger.warn("Error deleting booking history (continuing)", { 
        action: "deleteBooking", 
        entityId: id 
      });
    }

    // Finally delete the booking
    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting booking", error, { action: "deleteBooking", entityId: id });
      return { data: null, error: error.message };
    }

    logger.mutation("delete", "booking", id);
    return { data: null, error: null };
  } catch (err) {
    const appError = handleError(err, { action: "deleteBooking" });
    return { data: null, error: appError.message };
  }
}

// -----------------------------------------------------------------------------
// Check for Overlapping Bookings (for conflict prevention)
// -----------------------------------------------------------------------------
export async function checkOverlappingBookings(
  lineId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string
): Promise<ServiceResult<{ hasOverlap: boolean; count: number }>> {
  try {
    let query = supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("line_id", lineId)
      .lte("start_date", endDate)
      .gte("end_date", startDate);

    if (excludeBookingId) {
      query = query.neq("id", excludeBookingId);
    }

    const { count, error } = await query;

    if (error) {
      logger.error("Error checking overlapping bookings", error);
      return { data: null, error: error.message };
    }

    return { 
      data: { 
        hasOverlap: (count ?? 0) > 0, 
        count: count ?? 0 
      }, 
      error: null 
    };
  } catch (err) {
    const appError = handleError(err, { action: "checkOverlappingBookings" });
    return { data: null, error: appError.message };
  }
}
