import { supabase } from "@/lib/supabase/client";
import type { CourseType, ServiceResult } from "@/types";

// =============================================================================
// Course Types Service
// =============================================================================

export async function fetchCourseTypes(): Promise<ServiceResult<CourseType[]>> {
  const { data, error } = await supabase
    .from("course_types")
    .select("id, name, description, weekly_capacity")
    .order("name");

  if (error) {
    console.error("Error fetching course types:", error.message);
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as CourseType[], error: null };
}

export async function createCourseType(payload: {
  name: string;
  description: string | null;
  weekly_capacity: number | null;
}): Promise<ServiceResult<CourseType>> {
  const { data, error } = await supabase
    .from("course_types")
    .insert(payload)
    .select("id, name, description, weekly_capacity")
    .single();

  if (error) {
    console.error("Error creating course type:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as CourseType, error: null };
}

export async function updateCourseType(
  id: string,
  payload: Partial<Omit<CourseType, "id">>
): Promise<ServiceResult<CourseType>> {
  const { data, error } = await supabase
    .from("course_types")
    .update(payload)
    .eq("id", id)
    .select("id, name, description, weekly_capacity")
    .single();

  if (error) {
    console.error("Error updating course type:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as CourseType, error: null };
}

export async function deleteCourseType(id: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.from("course_types").delete().eq("id", id);

  if (error) {
    console.error("Error deleting course type:", error.message);
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
