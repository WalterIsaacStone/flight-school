"use client";

import { useMemo } from "react";
import {
  useBookings,
  useStudents,
  useLines,
  useCourseTypes,
  useBillingTags,
  useActionsForBooking,
  useBookingHistory,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  useCreateStudent,
  useCreateLine,
  useUpdateLine,
  useDeleteLine,
  useCreateAction,
  useToggleAction,
  useDeleteAction,
  useLogBookingHistory,
} from "@/hooks/useData";
import { toDateString, normalizeDateString } from "@/lib/utils/dates";
import type { FilterState } from "./useCalendarState";

// =============================================================================
// Calendar Data Hook - All Data Fetching & Mutations
// =============================================================================

export function useCalendarData(
  filters: FilterState,
  weekStart: Date,
  weekEnd: Date
) {
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const bookingsQuery = useBookings();
  const studentsQuery = useStudents();
  const linesQuery = useLines();
  const courseTypesQuery = useCourseTypes();
  const billingTagsQuery = useBillingTags();

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();
  const createStudent = useCreateStudent();
  const createLine = useCreateLine();
  const updateLine = useUpdateLine();
  const deleteLine = useDeleteLine();
  const createAction = useCreateAction();
  const toggleAction = useToggleAction();
  const deleteAction = useDeleteAction();
  const logHistory = useLogBookingHistory();

  // ---------------------------------------------------------------------------
  // Derived Data
  // ---------------------------------------------------------------------------
  const bookings = bookingsQuery.data ?? [];
  const students = studentsQuery.data ?? [];
  const lines = linesQuery.data ?? [];
  const courseTypes = courseTypesQuery.data ?? [];
  const billingTags = billingTagsQuery.data ?? [];

  // Loading state
  const isLoading = 
    bookingsQuery.isLoading || 
    studentsQuery.isLoading || 
    linesQuery.isLoading;

  // Error state
  const error = bookingsQuery.error;

  // Filter bookings
  const filteredBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (filters.lineId !== "all" && b.line_id !== filters.lineId) return false;
        if (filters.courseType && b.course_type !== filters.courseType) return false;
        if (filters.billingTag && (b.billing_tag || "") !== filters.billingTag) return false;
        return true;
      }),
    [bookings, filters]
  );

  // Visible lines (respects line filter)
  const visibleLines = useMemo(
    () =>
      lines.filter(
        (line) => filters.lineId === "all" || line.id === filters.lineId
      ),
    [lines, filters.lineId]
  );

  // Course type options from existing bookings
  const courseTypeOptions = useMemo(
    () =>
      Array.from(new Set(bookings.map((b) => b.course_type))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [bookings]
  );

  // Billing tag options from existing bookings
  const billingTagOptions = useMemo(
    () =>
      Array.from(
        new Set(bookings.map((b) => b.billing_tag || "").filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [bookings]
  );

  // Course type chips (from DB or defaults)
  const courseTypeChipLabels = useMemo(() => {
    const fromDb = courseTypes.map((ct) => ct.name);
    if (fromDb.length > 0) return fromDb;
    return [
      "CFI Initial – 10 Day",
      "CFII – 7 Day",
      "Instrument Finish-Up",
      "Commercial Finish-Up",
      "10-Day",
    ];
  }, [courseTypes]);

  // Weekly capacity tracking
  const weeklyCapacitySummary = useMemo(() => {
    const startKey = toDateString(weekStart);
    const endKey = toDateString(weekEnd);
    
    // Count bookings per course type in this week
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      const startStr = normalizeDateString(b.start_date);
      const endStr = normalizeDateString(b.end_date);
      if (!startStr || !endStr) return;
      if (endStr < startKey || startStr > endKey) return;
      const type = b.course_type || "Course";
      counts[type] = (counts[type] || 0) + 1;
    });

    // Build summary for course types with capacity
    return courseTypes
      .filter((ct) => ct.weekly_capacity != null && ct.weekly_capacity > 0)
      .map((ct) => ({
        name: ct.name,
        capacity: ct.weekly_capacity as number,
        booked: counts[ct.name] || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [bookings, courseTypes, weekStart, weekEnd]);

  // ---------------------------------------------------------------------------
  // Mutation States
  // ---------------------------------------------------------------------------
  const isSaving = createBooking.isPending || updateBooking.isPending;
  const isDeleting = deleteBooking.isPending;

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Raw data
    bookings,
    students,
    lines,
    courseTypes,
    billingTags,

    // Derived data
    filteredBookings,
    visibleLines,
    courseTypeOptions,
    billingTagOptions,
    courseTypeChipLabels,
    weeklyCapacitySummary,

    // State
    isLoading,
    error,
    isSaving,
    isDeleting,

    // Mutations
    mutations: {
      createBooking,
      updateBooking,
      deleteBooking,
      createStudent,
      createLine,
      updateLine,
      deleteLine,
      createAction,
      toggleAction,
      deleteAction,
      logHistory,
    },
  };
}

// =============================================================================
// Booking-Specific Data Hook (for drawer)
// =============================================================================

export function useBookingDetails(bookingId: string | null) {
  const actionsQuery = useActionsForBooking(bookingId);
  const historyQuery = useBookingHistory(bookingId);

  return {
    actions: actionsQuery.data ?? [],
    actionsLoading: actionsQuery.isLoading,
    history: historyQuery.data ?? [],
    historyLoading: historyQuery.isLoading,
  };
}
