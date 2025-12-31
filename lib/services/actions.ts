import { supabase } from "@/lib/supabase/client";
import type { ActionItem, ServiceResult } from "@/types";

// =============================================================================
// Actions Service
// =============================================================================

export async function fetchAllActions(): Promise<ServiceResult<ActionItem[]>> {
  const { data, error } = await supabase
    .from("actions")
    .select("id, booking_id, title, due_date, completed")
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching actions:", error.message);
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as ActionItem[], error: null };
}

export async function fetchActionsForBooking(
  bookingId: string
): Promise<ServiceResult<ActionItem[]>> {
  const { data, error } = await supabase
    .from("actions")
    .select("id, booking_id, title, due_date, completed")
    .eq("booking_id", bookingId)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching booking actions:", error.message);
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as ActionItem[], error: null };
}

export async function createAction(
  bookingId: string,
  title: string,
  dueDate: string | null
): Promise<ServiceResult<ActionItem>> {
  const { data, error } = await supabase
    .from("actions")
    .insert({
      booking_id: bookingId,
      title,
      due_date: dueDate || null,
      completed: false,
    })
    .select("id, booking_id, title, due_date, completed")
    .single();

  if (error) {
    console.error("Error creating action:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as ActionItem, error: null };
}

export async function toggleActionCompleted(
  id: string,
  completed: boolean
): Promise<ServiceResult<ActionItem>> {
  const { data, error } = await supabase
    .from("actions")
    .update({ completed })
    .eq("id", id)
    .select("id, booking_id, title, due_date, completed")
    .single();

  if (error) {
    console.error("Error updating action:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as ActionItem, error: null };
}

export async function deleteAction(id: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.from("actions").delete().eq("id", id);

  if (error) {
    console.error("Error deleting action:", error.message);
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
