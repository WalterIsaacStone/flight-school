import { supabase } from "@/lib/supabase/client";
import type { BillingTag, ServiceResult } from "@/types";

// =============================================================================
// Billing Tags Service
// =============================================================================

export async function fetchBillingTags(): Promise<ServiceResult<BillingTag[]>> {
  const { data, error } = await supabase
    .from("billing_tags")
    .select("id, name, description")
    .order("name");

  if (error) {
    console.error("Error fetching billing tags:", error.message);
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as BillingTag[], error: null };
}

export async function createBillingTag(payload: {
  name: string;
  description: string | null;
}): Promise<ServiceResult<BillingTag>> {
  const { data, error } = await supabase
    .from("billing_tags")
    .insert(payload)
    .select("id, name, description")
    .single();

  if (error) {
    console.error("Error creating billing tag:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as BillingTag, error: null };
}

export async function updateBillingTag(
  id: string,
  payload: Partial<Omit<BillingTag, "id">>
): Promise<ServiceResult<BillingTag>> {
  const { data, error } = await supabase
    .from("billing_tags")
    .update(payload)
    .eq("id", id)
    .select("id, name, description")
    .single();

  if (error) {
    console.error("Error updating billing tag:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as BillingTag, error: null };
}

export async function deleteBillingTag(id: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.from("billing_tags").delete().eq("id", id);

  if (error) {
    console.error("Error deleting billing tag:", error.message);
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
