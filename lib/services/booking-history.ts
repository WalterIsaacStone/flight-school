import { supabase } from "@/lib/supabase/client";
import type { BookingHistoryItem, ServiceResult } from "@/types";

// =============================================================================
// Booking History Service
// =============================================================================

export async function fetchBookingHistory(
  bookingId: string
): Promise<ServiceResult<BookingHistoryItem[]>> {
  const { data, error } = await supabase
    .from("booking_history")
    .select("id, booking_id, created_at, description")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching booking history:", error.message);
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as BookingHistoryItem[], error: null };
}

export async function logBookingHistory(
  bookingId: string,
  description: string
): Promise<ServiceResult<BookingHistoryItem>> {
  if (!bookingId) {
    return { data: null, error: "Missing booking ID" };
  }

  const { data, error } = await supabase
    .from("booking_history")
    .insert({ booking_id: bookingId, description })
    .select("id, booking_id, created_at, description")
    .single();

  if (error) {
    console.error("Error logging booking history:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as BookingHistoryItem, error: null };
}
