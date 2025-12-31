"use client";

// =============================================================================
// CalendarPage - Main Container (Logic + Orchestration)
// =============================================================================

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { usePrompt } from "@/components/ui/PromptDialog";
import { CalendarSkeleton } from "@/components/ui/Skeleton";

// Feature imports
import {
  useCalendarState,
  useDrawerState,
  useCalendarData,
  useBookingDetails,
} from "../hooks";
import { CalendarHeader } from "../components/CalendarHeader";
import { FilterBar } from "../components/FilterBar";
import { WeekView } from "../components/WeekView";
import { MonthView } from "../components/MonthView";
import { BookingDrawer } from "./BookingDrawer";

// Types
import type { BookingForEdit } from "../hooks/useDrawerState";

// =============================================================================
// Component
// =============================================================================

export function CalendarPage() {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const { showToast } = useToast();
  const confirm = useConfirm();
  const prompt = usePrompt();

  // Calendar state (view mode, navigation, filters)
  const calendar = useCalendarState();

  // Drawer state (open/close, form draft, new student/action forms)
  const drawer = useDrawerState();

  // Data fetching & mutations
  const data = useCalendarData(
    calendar.filters,
    calendar.weekStart,
    calendar.weekEnd
  );

  // Booking-specific data (actions, history) for the drawer
  const bookingDetails = useBookingDetails(drawer.activeBooking?.id ?? null);

  // Line editing state (kept here since it's UI-only)
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingLineName, setEditingLineName] = useState("");

  // ---------------------------------------------------------------------------
  // Line Handlers
  // ---------------------------------------------------------------------------
  const handleAddLine = useCallback(async () => {
    const name = await prompt({
      title: "Add Line",
      message: "Enter name for the new line (e.g. CFI Line – Isaac):",
      placeholder: "Line name",
    });

    if (!name) return;

    try {
      await data.mutations.createLine.mutateAsync(name);
      showToast("Line added", "success");
    } catch {
      showToast("Error adding line", "error");
    }
  }, [prompt, data.mutations.createLine, showToast]);

  const handleStartEditLine = useCallback((lineId: string, name: string) => {
    setEditingLineId(lineId);
    setEditingLineName(name);
  }, []);

  const handleSaveEditLine = useCallback(async () => {
    if (!editingLineId) return;
    const trimmed = editingLineName.trim();
    if (!trimmed) {
      showToast("Line name cannot be empty", "warning");
      return;
    }

    try {
      await data.mutations.updateLine.mutateAsync({
        id: editingLineId,
        name: trimmed,
      });
      setEditingLineId(null);
      setEditingLineName("");
      showToast("Line renamed", "success");
    } catch {
      showToast("Error renaming line", "error");
    }
  }, [editingLineId, editingLineName, data.mutations.updateLine, showToast]);

  const handleCancelEditLine = useCallback(() => {
    setEditingLineId(null);
    setEditingLineName("");
  }, []);

  const handleDeleteLine = useCallback(
    async (lineId: string, lineName: string) => {
      const confirmed = await confirm({
        title: "Delete Line",
        message: `Are you sure you want to delete "${lineName}" and all its bookings/actions?`,
        confirmLabel: "Delete",
        variant: "danger",
      });

      if (!confirmed) return;

      try {
        await data.mutations.deleteLine.mutateAsync(lineId);
        showToast("Line deleted", "success");
      } catch {
        showToast("Error deleting line", "error");
      }
    },
    [confirm, data.mutations.deleteLine, showToast]
  );

  // ---------------------------------------------------------------------------
  // Cell & Booking Click Handlers
  // ---------------------------------------------------------------------------
  const handleCellClick = useCallback(
    (lineId: string, dateKey: string) => {
      const date = new Date(dateKey + "T00:00:00");
      const defaultStudentId = data.students[0]?.id ?? "";
      drawer.openCreate(lineId, date, defaultStudentId);
    },
    [data.students, drawer]
  );

  const handleBookingClick = useCallback(
    (booking: BookingForEdit) => {
      drawer.openEdit(booking);
    },
    [drawer]
  );

  // ---------------------------------------------------------------------------
  // Save Booking
  // ---------------------------------------------------------------------------
  const handleSave = useCallback(async () => {
    if (!drawer.draft) return;

    let studentId = drawer.draft.student_id;

    // Create new student if name provided
    if (drawer.hasNewStudent) {
      try {
        const newStudent = await data.mutations.createStudent.mutateAsync({
          full_name: drawer.newStudent.name.trim(),
          email: drawer.newStudent.email || null,
          phone: drawer.newStudent.phone || null,
          notes: drawer.newStudent.notes || null,
        });
        studentId = newStudent.id;
      } catch {
        showToast("Could not create new student", "error");
        return;
      }
    }

    if (!studentId) {
      showToast("Please select a student or create a new one", "warning");
      return;
    }

    if (!drawer.draft.start_date || !drawer.draft.end_date) {
      showToast("Please choose start and end dates", "warning");
      return;
    }

    const payload = {
      line_id: drawer.draft.line_id,
      student_id: studentId,
      course_type: drawer.draft.course_type || "Course",
      start_date: drawer.draft.start_date,
      end_date: drawer.draft.end_date,
      billing_tag: drawer.draft.billing_tag || null,
      note: drawer.draft.note || null,
    };

    try {
      if (drawer.mode === "create") {
        const created = await data.mutations.createBooking.mutateAsync(payload);
        await data.mutations.logHistory.mutateAsync({
          bookingId: created.id,
          description: `Booking created: ${payload.course_type} (${payload.start_date} → ${payload.end_date})`,
        });
        showToast("Booking created successfully", "success");
      } else {
        const bookingId = drawer.draft.id!;
        await data.mutations.updateBooking.mutateAsync({ id: bookingId, payload });

        // Log changes
        if (drawer.activeBooking) {
          const changes: string[] = [];
          if (drawer.activeBooking.course_type !== payload.course_type) {
            changes.push(`Course type changed to "${payload.course_type}"`);
          }
          if (drawer.activeBooking.billing_tag !== payload.billing_tag) {
            changes.push(`Billing tag changed to "${payload.billing_tag || "None"}"`);
          }
          if (drawer.activeBooking.start_date !== payload.start_date) {
            changes.push(`Start date changed to ${payload.start_date}`);
          }
          if (drawer.activeBooking.end_date !== payload.end_date) {
            changes.push(`End date changed to ${payload.end_date}`);
          }
          if ((drawer.activeBooking.note || "") !== (payload.note || "")) {
            changes.push("Notes updated");
          }

          for (const desc of changes) {
            await data.mutations.logHistory.mutateAsync({ bookingId, description: desc });
          }
        }

        showToast("Booking updated successfully", "success");
      }

      drawer.close();
    } catch {
      showToast("Error saving booking", "error");
    }
  }, [drawer, data.mutations, showToast]);

  // ---------------------------------------------------------------------------
  // Delete Booking
  // ---------------------------------------------------------------------------
  const handleDeleteBooking = useCallback(async () => {
    if (!drawer.draft?.id) return;

    const confirmed = await confirm({
      title: "Delete Booking",
      message: "Are you sure you want to delete this booking and all its actions?",
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await data.mutations.deleteBooking.mutateAsync(drawer.draft.id);
      showToast("Booking deleted", "success");
      drawer.close();
    } catch {
      showToast("Error deleting booking", "error");
    }
  }, [drawer, confirm, data.mutations.deleteBooking, showToast]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  const handleAddAction = useCallback(async () => {
    if (!drawer.draft?.id) {
      showToast("Save the booking first, then add actions", "warning");
      return;
    }
    if (!drawer.newAction.title.trim()) {
      showToast("Action title is required", "warning");
      return;
    }

    try {
      await data.mutations.createAction.mutateAsync({
        bookingId: drawer.draft.id,
        title: drawer.newAction.title.trim(),
        dueDate: drawer.newAction.dueDate || null,
      });
      await data.mutations.logHistory.mutateAsync({
        bookingId: drawer.draft.id,
        description: `Action added: "${drawer.newAction.title.trim()}"${
          drawer.newAction.dueDate ? ` (due ${drawer.newAction.dueDate})` : ""
        }`,
      });
      drawer.resetNewAction();
      showToast("Action added", "success");
    } catch {
      showToast("Error adding action", "error");
    }
  }, [drawer, data.mutations, showToast]);

  const handleToggleAction = useCallback(
    async (actionId: string, completed: boolean, title: string) => {
      if (!drawer.draft?.id) return;

      try {
        await data.mutations.toggleAction.mutateAsync({
          id: actionId,
          completed: !completed,
          bookingId: drawer.draft.id,
        });
        await data.mutations.logHistory.mutateAsync({
          bookingId: drawer.draft.id,
          description: `Action "${title}" marked ${!completed ? "completed" : "incomplete"}`,
        });
      } catch {
        showToast("Error updating action", "error");
      }
    },
    [drawer.draft?.id, data.mutations, showToast]
  );

  const handleDeleteAction = useCallback(
    async (actionId: string) => {
      if (!drawer.draft?.id) return;

      const confirmed = await confirm({
        title: "Delete Action",
        message: "Delete this action?",
        confirmLabel: "Delete",
        variant: "danger",
      });

      if (!confirmed) return;

      try {
        await data.mutations.deleteAction.mutateAsync({
          id: actionId,
          bookingId: drawer.draft.id,
        });
        await data.mutations.logHistory.mutateAsync({
          bookingId: drawer.draft.id,
          description: "Action deleted",
        });
        showToast("Action deleted", "success");
      } catch {
        showToast("Error deleting action", "error");
      }
    },
    [drawer.draft?.id, confirm, data.mutations, showToast]
  );

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------
  if (data.error) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            Error loading data
          </h2>
          <p className="text-slate-300 mb-4">{data.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-slate-900 text-slate-50">
      <div className="max-w-6xl mx-auto py-6 px-4 space-y-4">
        {/* Header */}
        <CalendarHeader
          viewMode={calendar.viewMode}
          onViewModeChange={calendar.setViewMode}
          weekBaseDate={calendar.weekBaseDate}
          onWeekDateChange={calendar.setWeekBaseDate}
          onPrevWeek={calendar.goToPrevWeek}
          onNextWeek={calendar.goToNextWeek}
          onToday={calendar.goToToday}
          monthStart={calendar.monthStart}
          onPrevMonth={calendar.goToPrevMonth}
          onNextMonth={calendar.goToNextMonth}
          onCurrentMonth={calendar.goToCurrentMonth}
          capacitySummary={data.weeklyCapacitySummary}
        />

        {/* Filters */}
        <FilterBar
          lines={data.lines}
          filterLineId={calendar.filters.lineId}
          filterCourseType={calendar.filters.courseType}
          filterBillingTag={calendar.filters.billingTag}
          courseTypeOptions={data.courseTypeOptions}
          billingTagOptions={data.billingTagOptions}
          onLineChange={calendar.setFilterLineId}
          onCourseTypeChange={calendar.setFilterCourseType}
          onBillingTagChange={calendar.setFilterBillingTag}
          onAddLine={handleAddLine}
        />

        {/* Calendar Grid */}
        {data.isLoading ? (
          <CalendarSkeleton />
        ) : calendar.viewMode === "week" ? (
          <WeekView
            days={calendar.days}
            dayKeys={calendar.dayKeys}
            lines={data.visibleLines}
            bookings={data.filteredBookings}
            editingLineId={editingLineId}
            editingLineName={editingLineName}
            onEditingLineNameChange={setEditingLineName}
            onStartEditLine={handleStartEditLine}
            onSaveEditLine={handleSaveEditLine}
            onCancelEditLine={handleCancelEditLine}
            onDeleteLine={handleDeleteLine}
            onCellClick={handleCellClick}
            onBookingClick={handleBookingClick}
          />
        ) : (
          <MonthView
            monthDays={calendar.monthDays}
            monthStart={calendar.monthStart}
            bookings={data.filteredBookings}
            onDayClick={calendar.jumpToWeek}
          />
        )}

        {/* Booking Drawer */}
        <BookingDrawer
          drawer={drawer}
          students={data.students}
          billingTags={data.billingTags}
          courseTypeChips={data.courseTypeChipLabels}
          actions={bookingDetails.actions}
          actionsLoading={bookingDetails.actionsLoading}
          history={bookingDetails.history}
          historyLoading={bookingDetails.historyLoading}
          isSaving={data.isSaving}
          isCreatingStudent={data.mutations.createStudent.isPending}
          isAddingAction={data.mutations.createAction.isPending}
          onSave={handleSave}
          onDelete={handleDeleteBooking}
          onAddAction={handleAddAction}
          onToggleAction={handleToggleAction}
          onDeleteAction={handleDeleteAction}
        />
      </div>
    </main>
  );
}
