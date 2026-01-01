import { supabase } from "@/lib/supabase/client";
import type { LineTag, CreateLineTagInput } from "@/types";

// =============================================================================
// Line Tags Service
// =============================================================================

/**
 * Fetch all line tags ordered by sort_order
 */
export async function fetchLineTags(): Promise<LineTag[]> {
  const { data, error } = await supabase
    .from("line_tags")
    .select("id, name, color, description, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching line tags:", error.message);
    throw new Error(error.message);
  }

  return (data || []) as LineTag[];
}

/**
 * Create a new line tag
 */
export async function createLineTag(input: CreateLineTagInput): Promise<LineTag> {
  // Get max sort_order to add at end
  const { data: existing } = await supabase
    .from("line_tags")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) + 1 : 1;

  const { data, error } = await supabase
    .from("line_tags")
    .insert({
      name: input.name,
      color: input.color || "slate",
      description: input.description || null,
      sort_order: nextOrder,
    })
    .select("id, name, color, description, sort_order")
    .single();

  if (error) {
    console.error("Error creating line tag:", error.message);
    throw new Error(error.message);
  }

  return data as LineTag;
}

/**
 * Update a line tag
 */
export async function updateLineTag(
  id: string,
  updates: Partial<CreateLineTagInput>
): Promise<LineTag> {
  const { data, error } = await supabase
    .from("line_tags")
    .update({
      name: updates.name,
      color: updates.color,
      description: updates.description,
    })
    .eq("id", id)
    .select("id, name, color, description, sort_order")
    .single();

  if (error) {
    console.error("Error updating line tag:", error.message);
    throw new Error(error.message);
  }

  return data as LineTag;
}

/**
 * Delete a line tag (lines using it will have line_tag_id set to null)
 */
export async function deleteLineTag(id: string): Promise<void> {
  const { error } = await supabase.from("line_tags").delete().eq("id", id);

  if (error) {
    console.error("Error deleting line tag:", error.message);
    throw new Error(error.message);
  }
}

/**
 * Update line's tag assignment
 */
export async function updateLineTag_assignment(
  lineId: string,
  lineTagId: string | null
): Promise<void> {
  const { error } = await supabase
    .from("lines")
    .update({ line_tag_id: lineTagId })
    .eq("id", lineId);

  if (error) {
    console.error("Error updating line tag assignment:", error.message);
    throw new Error(error.message);
  }
}

/**
 * Update line sort orders (for drag and drop)
 */
export async function updateLineSortOrders(
  updates: { id: string; sort_order: number }[]
): Promise<void> {
  // Update each line's sort_order
  const promises = updates.map(({ id, sort_order }) =>
    supabase.from("lines").update({ sort_order }).eq("id", id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    console.error("Error updating sort orders:", errors[0].error?.message);
    throw new Error(errors[0].error?.message || "Failed to update sort orders");
  }
}
