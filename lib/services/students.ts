import { supabase } from "@/lib/supabase/client";
import type { Student, ServiceResult } from "@/types";

// =============================================================================
// Students Service
// =============================================================================

export async function fetchStudents(): Promise<ServiceResult<Student[]>> {
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, email, phone, notes")
    .order("full_name");

  if (error) {
    console.error("Error fetching students:", error.message);
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as Student[], error: null };
}

export async function createStudent(
  payload: Omit<Student, "id">
): Promise<ServiceResult<Student>> {
  const { data, error } = await supabase
    .from("students")
    .insert({
      full_name: payload.full_name,
      email: payload.email || null,
      phone: payload.phone || null,
      notes: payload.notes || null,
    })
    .select("id, full_name, email, phone, notes")
    .single();

  if (error) {
    console.error("Error creating student:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as Student, error: null };
}

export async function updateStudent(
  id: string,
  payload: Partial<Omit<Student, "id">>
): Promise<ServiceResult<Student>> {
  const { data, error } = await supabase
    .from("students")
    .update(payload)
    .eq("id", id)
    .select("id, full_name, email, phone, notes")
    .single();

  if (error) {
    console.error("Error updating student:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as Student, error: null };
}

export async function deleteStudent(id: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) {
    console.error("Error deleting student:", error.message);
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
