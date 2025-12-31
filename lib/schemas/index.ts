import { z } from "zod";

// =============================================================================
// Zod Schemas - Runtime Validation at Boundaries
// =============================================================================

// -----------------------------------------------------------------------------
// Base ID Schema (UUID)
// -----------------------------------------------------------------------------
const uuidSchema = z.string().uuid();

// -----------------------------------------------------------------------------
// Line Schemas
// -----------------------------------------------------------------------------
export const LineSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255),
});

export const LineArraySchema = z.array(LineSchema);

export type Line = z.infer<typeof LineSchema>;

// -----------------------------------------------------------------------------
// Student Schemas
// -----------------------------------------------------------------------------
export const StudentSchema = z.object({
  id: uuidSchema,
  full_name: z.string().min(1).max(255),
  email: z.string().email().nullable(),
  phone: z.string().max(50).nullable(),
  notes: z.string().max(2000).nullable(),
});

export const StudentArraySchema = z.array(StudentSchema);

export const CreateStudentSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email").nullable().or(z.literal("")),
  phone: z.string().max(50).nullable().or(z.literal("")),
  notes: z.string().max(2000).nullable().or(z.literal("")),
});

export type Student = z.infer<typeof StudentSchema>;
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

// -----------------------------------------------------------------------------
// Course Type Schemas
// -----------------------------------------------------------------------------
export const CourseTypeSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).nullable(),
  weekly_capacity: z.number().int().min(0).nullable(),
});

export const CourseTypeArraySchema = z.array(CourseTypeSchema);

export const CreateCourseTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).nullable().or(z.literal("")),
  weekly_capacity: z.number().int().min(0).nullable(),
});

export type CourseType = z.infer<typeof CourseTypeSchema>;
export type CreateCourseTypeInput = z.infer<typeof CreateCourseTypeSchema>;

// -----------------------------------------------------------------------------
// Billing Tag Schemas
// -----------------------------------------------------------------------------
export const BillingTagSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).nullable(),
});

export const BillingTagArraySchema = z.array(BillingTagSchema);

export const CreateBillingTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).nullable().or(z.literal("")),
});

export type BillingTag = z.infer<typeof BillingTagSchema>;
export type CreateBillingTagInput = z.infer<typeof CreateBillingTagSchema>;

// -----------------------------------------------------------------------------
// Student Tag Schemas
// -----------------------------------------------------------------------------
export const StudentTagSchema = z.object({
  id: uuidSchema,
  student_id: uuidSchema,
  label: z.string().min(1).max(100),
});

export const StudentTagArraySchema = z.array(StudentTagSchema);

export type StudentTag = z.infer<typeof StudentTagSchema>;

// -----------------------------------------------------------------------------
// Booking Schemas
// -----------------------------------------------------------------------------
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

export const BookingSchema = z.object({
  id: uuidSchema,
  line_id: uuidSchema,
  student_id: uuidSchema,
  course_type: z.string().min(1).max(255),
  start_date: dateStringSchema,
  end_date: dateStringSchema,
  billing_tag: z.string().max(255).nullable(),
  note: z.string().max(2000).nullable(),
  updated_at: z.string().datetime().optional(), // For optimistic concurrency
});

export const BookingWithStudentSchema = BookingSchema.extend({
  students: z.object({
    full_name: z.string().nullable(),
    email: z.string().nullable().optional(),
  }).nullable(),
});

export const BookingArraySchema = z.array(BookingWithStudentSchema);

export const CreateBookingSchema = z.object({
  line_id: uuidSchema,
  student_id: uuidSchema,
  course_type: z.string().min(1, "Course type is required").max(255),
  start_date: dateStringSchema,
  end_date: dateStringSchema,
  billing_tag: z.string().max(255).nullable().or(z.literal("")),
  note: z.string().max(2000).nullable().or(z.literal("")),
}).refine(
  (data) => data.start_date <= data.end_date,
  { message: "Start date must be before or equal to end date", path: ["end_date"] }
);

export type Booking = z.infer<typeof BookingSchema>;
export type BookingWithStudent = z.infer<typeof BookingWithStudentSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

// -----------------------------------------------------------------------------
// Action Schemas
// -----------------------------------------------------------------------------
export const ActionItemSchema = z.object({
  id: uuidSchema,
  booking_id: uuidSchema,
  title: z.string().min(1).max(500),
  due_date: dateStringSchema.nullable(),
  completed: z.boolean(),
});

export const ActionItemArraySchema = z.array(ActionItemSchema);

export const CreateActionSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  due_date: dateStringSchema.nullable().or(z.literal("")),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;
export type CreateActionInput = z.infer<typeof CreateActionSchema>;

// -----------------------------------------------------------------------------
// Booking History Schemas
// -----------------------------------------------------------------------------
export const BookingHistoryItemSchema = z.object({
  id: uuidSchema,
  booking_id: uuidSchema,
  created_at: z.string().datetime(),
  description: z.string().max(2000),
});

export const BookingHistoryArraySchema = z.array(BookingHistoryItemSchema);

export type BookingHistoryItem = z.infer<typeof BookingHistoryItemSchema>;

// -----------------------------------------------------------------------------
// Form State Schemas (for UI validation)
// -----------------------------------------------------------------------------
export const BookingFormSchema = z.object({
  id: z.string().uuid().optional(), // Present when editing, absent when creating
  line_id: z.string().min(1, "Line is required"),
  student_id: z.string().min(1, "Student is required"),
  course_type: z.string().min(1, "Course type is required"),
  billing_tag: z.string(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  note: z.string(),
}).refine(
  (data) => !data.start_date || !data.end_date || data.start_date <= data.end_date,
  { message: "Start date must be before or equal to end date", path: ["end_date"] }
);

export type BookingFormData = z.infer<typeof BookingFormSchema>;
