import { supabase } from "@/lib/supabase/client";
import type { StudentTag, ServiceResult } from "@/types";

// =============================================================================
// Student Tags Service
// =============================================================================

export async function fetchStudentTags(): Promise<ServiceResult<StudentTag[]>> {
  const { data, error } = await supabase
    .from("student_tags")
    .select("id, student_id, label")
    .order("inserted_at", { ascending: true });

  if (error) {
    console.error("Error fetching student tags:", error.message);
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as StudentTag[], error: null };
}

export async function createStudentTag(
  studentId: string,
  label: string
): Promise<ServiceResult<StudentTag>> {
  const { data, error } = await supabase
    .from("student_tags")
    .insert({ student_id: studentId, label })
    .select("id, student_id, label")
    .single();

  if (error) {
    console.error("Error creating student tag:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as StudentTag, error: null };
}

export async function deleteStudentTag(id: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.from("student_tags").delete().eq("id", id);

  if (error) {
    console.error("Error deleting student tag:", error.message);
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
