import { supabase } from "@/lib/supabase/client";
import type { Line, ServiceResult } from "@/types";

// =============================================================================
// Lines Service
// =============================================================================

export async function fetchLines(): Promise<ServiceResult<Line[]>> {
  const { data, error } = await supabase
    .from("lines")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching lines:", error.message);
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as Line[], error: null };
}

export async function createLine(name: string): Promise<ServiceResult<Line>> {
  const { data, error } = await supabase
    .from("lines")
    .insert({ name })
    .select("id, name")
    .single();

  if (error) {
    console.error("Error creating line:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as Line, error: null };
}

export async function updateLine(
  id: string,
  name: string
): Promise<ServiceResult<Line>> {
  const { data, error } = await supabase
    .from("lines")
    .update({ name })
    .eq("id", id)
    .select("id, name")
    .single();

  if (error) {
    console.error("Error updating line:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as Line, error: null };
}

export async function deleteLine(id: string): Promise<ServiceResult<null>> {
  // First get all bookings for this line
  const { data: bookings, error: bookingsQueryError } = await supabase
    .from("bookings")
    .select("id")
    .eq("line_id", id);

  if (bookingsQueryError) {
    console.error("Error fetching line bookings:", bookingsQueryError.message);
    return { data: null, error: bookingsQueryError.message };
  }

  const bookingIds = (bookings ?? []).map((b) => b.id);

  if (bookingIds.length > 0) {
    // Delete actions for these bookings
    const { error: actionsError } = await supabase
      .from("actions")
      .delete()
      .in("booking_id", bookingIds);

    if (actionsError) {
      console.error("Error deleting line actions:", actionsError.message);
      return { data: null, error: actionsError.message };
    }

    // Delete booking history
    const { error: historyError } = await supabase
      .from("booking_history")
      .delete()
      .in("booking_id", bookingIds);

    if (historyError) {
      console.error("Error deleting booking history:", historyError.message);
      // Continue anyway - history is non-critical
    }

    // Delete bookings
    const { error: bookingsError } = await supabase
      .from("bookings")
      .delete()
      .in("id", bookingIds);

    if (bookingsError) {
      console.error("Error deleting line bookings:", bookingsError.message);
      return { data: null, error: bookingsError.message };
    }
  }

  // Finally delete the line
  const { error } = await supabase.from("lines").delete().eq("id", id);

  if (error) {
    console.error("Error deleting line:", error.message);
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
