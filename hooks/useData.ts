"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as services from "@/lib/services";
import type {
  Booking,
  Student,
  Line,
  LineTag,
  ActionItem,
  CourseType,
  BillingTag,
  StudentTag,
  BookingHistoryItem,
} from "@/lib/schemas";

// Extended type for bookings with student info
type BookingWithStudent = Booking & {
  students: { full_name: string | null; email?: string | null } | null;
  updated_at?: string;
};

// Extended type for lines with tag info
type LineWithTag = Line & {
  line_tags?: LineTag | null;
};

// =============================================================================
// Query Keys
// =============================================================================

export const queryKeys = {
  bookings: ["bookings"] as const,
  students: ["students"] as const,
  lines: ["lines"] as const,
  lineTags: ["lineTags"] as const,
  actions: ["actions"] as const,
  actionsForBooking: (bookingId: string) => ["actions", bookingId] as const,
  courseTypes: ["courseTypes"] as const,
  billingTags: ["billingTags"] as const,
  studentTags: ["studentTags"] as const,
  bookingHistory: (bookingId: string) => ["bookingHistory", bookingId] as const,
};

// =============================================================================
// Bookings Hooks
// =============================================================================

export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: async () => {
      const result = await services.fetchBookings();
      if (result.error) throw new Error(result.error);
      return result.data as BookingWithStudent[];
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Booking, "id">) => {
      const result = await services.createBooking(payload);
      if (result.error) throw new Error(result.error);
      return result.data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<Booking, "id">>;
    }) => {
      const result = await services.updateBooking(id, payload);
      if (result.error) throw new Error(result.error);
      return result.data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await services.deleteBooking(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

// =============================================================================
// Students Hooks
// =============================================================================

export function useStudents() {
  return useQuery({
    queryKey: queryKeys.students,
    queryFn: async () => {
      const result = await services.fetchStudents();
      if (result.error) throw new Error(result.error);
      return result.data as Student[];
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Student, "id">) => {
      const result = await services.createStudent(payload);
      if (result.error) throw new Error(result.error);
      return result.data as Student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

// =============================================================================
// Lines Hooks
// =============================================================================

export function useLines() {
  return useQuery({
    queryKey: queryKeys.lines,
    queryFn: async () => {
      const result = await services.fetchLines();
      if (result.error) throw new Error(result.error);
      return result.data as Line[];
    },
  });
}

export function useCreateLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const result = await services.createLine(name);
      if (result.error) throw new Error(result.error);
      return result.data as Line;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lines });
    },
  });
}

export function useUpdateLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const result = await services.updateLine(id, name);
      if (result.error) throw new Error(result.error);
      return result.data as Line;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lines });
    },
  });
}

export function useDeleteLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await services.deleteLine(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lines });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

// =============================================================================
// Line Tags Hooks
// =============================================================================

export function useLineTags() {
  return useQuery({
    queryKey: queryKeys.lineTags,
    queryFn: async () => {
      return services.fetchLineTags();
    },
  });
}

export function useCreateLineTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; color?: string; description?: string }) => {
      return services.createLineTag({
        name: input.name,
        color: input.color || null,
        description: input.description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lineTags });
    },
  });
}

export function useUpdateLineTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; color?: string; description?: string };
    }) => {
      return services.updateLineTag(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lineTags });
    },
  });
}

export function useDeleteLineTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return services.deleteLineTag(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lineTags });
      queryClient.invalidateQueries({ queryKey: queryKeys.lines });
    },
  });
}

export function useUpdateLineTagAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lineId, lineTagId }: { lineId: string; lineTagId: string | null }) => {
      return services.updateLineTag_assignment(lineId, lineTagId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lines });
    },
  });
}

export function useUpdateLineSortOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      return services.updateLineSortOrders(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lines });
    },
  });
}

// =============================================================================
// Actions Hooks
// =============================================================================

export function useAllActions() {
  return useQuery({
    queryKey: queryKeys.actions,
    queryFn: async () => {
      const result = await services.fetchAllActions();
      if (result.error) throw new Error(result.error);
      return result.data as ActionItem[];
    },
  });
}

export function useActionsForBooking(bookingId: string | null) {
  return useQuery({
    queryKey: queryKeys.actionsForBooking(bookingId ?? ""),
    queryFn: async () => {
      if (!bookingId) return [];
      const result = await services.fetchActionsForBooking(bookingId);
      if (result.error) throw new Error(result.error);
      return result.data as ActionItem[];
    },
    enabled: !!bookingId,
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      title,
      dueDate,
    }: {
      bookingId: string;
      title: string;
      dueDate: string | null;
    }) => {
      const result = await services.createAction(bookingId, title, dueDate);
      if (result.error) throw new Error(result.error);
      return result.data as ActionItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.actionsForBooking(variables.bookingId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

export function useToggleAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      completed,
      bookingId,
    }: {
      id: string;
      completed: boolean;
      bookingId: string;
    }) => {
      const result = await services.toggleActionCompleted(id, completed);
      if (result.error) throw new Error(result.error);
      return result.data as ActionItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.actionsForBooking(variables.bookingId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

export function useDeleteAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bookingId }: { id: string; bookingId: string }) => {
      const result = await services.deleteAction(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.actionsForBooking(variables.bookingId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

// =============================================================================
// Course Types Hooks
// =============================================================================

export function useCourseTypes() {
  return useQuery({
    queryKey: queryKeys.courseTypes,
    queryFn: async () => {
      const result = await services.fetchCourseTypes();
      if (result.error) throw new Error(result.error);
      return result.data as CourseType[];
    },
  });
}

export function useCreateCourseType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description: string | null;
      weekly_capacity: number | null;
    }) => {
      const result = await services.createCourseType(payload);
      if (result.error) throw new Error(result.error);
      return result.data as CourseType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courseTypes });
    },
  });
}

export function useUpdateCourseType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<CourseType, "id">>;
    }) => {
      const result = await services.updateCourseType(id, payload);
      if (result.error) throw new Error(result.error);
      return result.data as CourseType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courseTypes });
    },
  });
}

export function useDeleteCourseType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await services.deleteCourseType(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courseTypes });
    },
  });
}

// =============================================================================
// Billing Tags Hooks
// =============================================================================

export function useBillingTags() {
  return useQuery({
    queryKey: queryKeys.billingTags,
    queryFn: async () => {
      const result = await services.fetchBillingTags();
      if (result.error) throw new Error(result.error);
      return result.data as BillingTag[];
    },
  });
}

export function useCreateBillingTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; description: string | null }) => {
      const result = await services.createBillingTag(payload);
      if (result.error) throw new Error(result.error);
      return result.data as BillingTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billingTags });
    },
  });
}

export function useUpdateBillingTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<BillingTag, "id">>;
    }) => {
      const result = await services.updateBillingTag(id, payload);
      if (result.error) throw new Error(result.error);
      return result.data as BillingTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billingTags });
    },
  });
}

export function useDeleteBillingTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await services.deleteBillingTag(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billingTags });
    },
  });
}

// =============================================================================
// Student Tags Hooks
// =============================================================================

export function useStudentTags() {
  return useQuery({
    queryKey: queryKeys.studentTags,
    queryFn: async () => {
      const result = await services.fetchStudentTags();
      if (result.error) throw new Error(result.error);
      return result.data as StudentTag[];
    },
  });
}

export function useCreateStudentTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      label,
    }: {
      studentId: string;
      label: string;
    }) => {
      const result = await services.createStudentTag(studentId, label);
      if (result.error) throw new Error(result.error);
      return result.data as StudentTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentTags });
    },
  });
}

export function useDeleteStudentTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await services.deleteStudentTag(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentTags });
    },
  });
}

// =============================================================================
// Booking History Hooks
// =============================================================================

export function useBookingHistory(bookingId: string | null) {
  return useQuery({
    queryKey: queryKeys.bookingHistory(bookingId ?? ""),
    queryFn: async () => {
      if (!bookingId) return [];
      const result = await services.fetchBookingHistory(bookingId);
      if (result.error) throw new Error(result.error);
      return result.data as BookingHistoryItem[];
    },
    enabled: !!bookingId,
  });
}

export function useLogBookingHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      description,
    }: {
      bookingId: string;
      description: string;
    }) => {
      const result = await services.logBookingHistory(bookingId, description);
      if (result.error) throw new Error(result.error);
      return result.data as BookingHistoryItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookingHistory(variables.bookingId),
      });
    },
  });
}
