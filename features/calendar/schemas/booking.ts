import { z } from "zod";

// =============================================================================
// Booking Form Schemas - Runtime Validation
// =============================================================================

// -----------------------------------------------------------------------------
// Booking Draft Schema (for form state)
// -----------------------------------------------------------------------------
export const BookingDraftSchema = z.object({
  id: z.string().uuid().optional(), // Present when editing
  line_id: z.string().min(1, "Line is required"),
  student_id: z.string().min(1, "Student is required"),
  course_type: z.string(),
  billing_tag: z.string(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  note: z.string(),
}).refine(
  (data) => !data.start_date || !data.end_date || data.start_date <= data.end_date,
  { message: "Start date must be before or equal to end date", path: ["end_date"] }
);

export type BookingDraft = z.infer<typeof BookingDraftSchema>;

// -----------------------------------------------------------------------------
// Booking Submission Schema (stricter, for API)
// -----------------------------------------------------------------------------
export const BookingSubmissionSchema = z.object({
  line_id: z.string().uuid(),
  student_id: z.string().uuid(),
  course_type: z.string().min(1, "Course type is required"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  billing_tag: z.string().nullable(),
  note: z.string().nullable(),
}).refine(
  (data) => data.start_date <= data.end_date,
  { message: "Start date must be before or equal to end date", path: ["end_date"] }
);

export type BookingSubmission = z.infer<typeof BookingSubmissionSchema>;

// -----------------------------------------------------------------------------
// New Student Schema
// -----------------------------------------------------------------------------
export const NewStudentSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email").nullable().or(z.literal("")),
  phone: z.string().max(50).nullable().or(z.literal("")),
  notes: z.string().max(2000).nullable().or(z.literal("")),
});

export type NewStudentInput = z.infer<typeof NewStudentSchema>;

// -----------------------------------------------------------------------------
// New Action Schema
// -----------------------------------------------------------------------------
export const NewActionSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  due_date: z.string().nullable().or(z.literal("")),
});

export type NewActionInput = z.infer<typeof NewActionSchema>;

// -----------------------------------------------------------------------------
// Validation Helpers
// -----------------------------------------------------------------------------
export function validateBookingDraft(data: unknown): { 
  success: boolean; 
  data?: BookingDraft; 
  errors?: string[] 
} {
  const result = BookingDraftSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((e) => 
    `${e.path.join(".")}: ${e.message}`
  );
  
  return { success: false, errors };
}

export function validateBookingSubmission(data: unknown): {
  success: boolean;
  data?: BookingSubmission;
  errors?: string[];
} {
  const result = BookingSubmissionSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((e) =>
    `${e.path.join(".")}: ${e.message}`
  );
  
  return { success: false, errors };
}
