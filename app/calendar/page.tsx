"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

/* ---------- Types ---------- */

type CourseType = {
  id: string;
  name: string;
  description: string | null;
  weekly_capacity: number | null;
};

type Line = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

type Booking = {
  id: string;
  line_id: string;
  student_id: string;
  course_type: string;
  start_date: string;
  end_date: string;
  billing_tag: string | null;
  note: string | null;
  students: {
    full_name: string | null;
    email?: string | null;
  } | null;
};

type BillingTag = {
  id: string;
  name: string;
  description: string | null;
};

type BookingFormState = {
  id?: string;
  line_id: string;
  student_id: string;
  course_type: string;
  billing_tag: string;
  start_date: string;
  end_date: string;
  note: string;
};

type ActionItem = {
  id: string;
  booking_id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  history: any;
};

type BookingHistoryItem = {
  id: string;
  booking_id: string;
  created_at: string;
  description: string;
};

/* ---------- Course type presets ---------- */

const COURSE_TYPE_PRESETS = [
  "CFI Initial – 10 Day",
  "CFII – 7 Day",
  "Instrument Finish-Up",
  "Commercial Finish-Up",
  "10-Day",
];

/* ---------- Date helpers ---------- */

function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // Monday-based
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
}

function toLocalISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Always returns "YYYY-MM-DD" (stripping any time portion) */
function normalizeDateString(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

/* ---------- Component ---------- */

export default function CalendarPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingTags, setBillingTags] = useState<BillingTag[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);

  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>(
    []
  );
  const [historyLoading, setHistoryLoading] = useState(false);

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  // Week base date: whatever day is selected; we show that week (Mon–Sun)
  const [weekBaseDate, setWeekBaseDate] = useState<Date>(() => new Date());

  // Filters
  const [filterLineId, setFilterLineId] = useState<"all" | string>("all");
  const [filterCourseType, setFilterCourseType] = useState<string>("");
  const [filterBillingTag, setFilterBillingTag] = useState<string>("");

  // Detail / Edit drawer
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [draft, setDraft] = useState<BookingFormState | null>(null);
  const [saving, setSaving] = useState(false);

  // Actions
  const [bookingActions, setBookingActions] = useState<ActionItem[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionDueDate, setNewActionDueDate] = useState("");

  // New student inline fields
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentNotes, setNewStudentNotes] = useState("");

  // Line editing
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingLineName, setEditingLineName] = useState("");

  // Drawer tab (Student / Tags / Actions)
  const [activeTab, setActiveTab] = useState<
    "student" | "tags" | "actions" | "history"
  >("student");

  // View mode: week vs month
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  // Month base date (used for month view navigation)
  const [monthBaseDate, setMonthBaseDate] = useState<Date>(() => new Date());

  /* ---------- Week / Month derived state ---------- */

  const weekStart = useMemo(() => startOfWeek(weekBaseDate), [weekBaseDate]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const dayKeys = useMemo(() => days.map((d) => toLocalISODate(d)), [days]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  // How many bookings of each course_type overlap this week?
  const weeklyBookingCountsByCourseType = useMemo(() => {
    const startKey = toLocalISODate(weekStart);
    const endKey = toLocalISODate(weekEnd);
    const counts: Record<string, number> = {};

    bookings.forEach((b) => {
      const startStr = normalizeDateString(b.start_date);
      const endStr = normalizeDateString(b.end_date);
      if (!startStr || !endStr) return;

      // skip if booking is completely outside this week
      if (endStr < startKey || startStr > endKey) return;

      const type = b.course_type || "Course";
      counts[type] = (counts[type] || 0) + 1;
    });

    return counts;
  }, [bookings, weekStart, weekEnd]);

  // Month view: 6-week grid (42 days), starting on Monday that contains the 1st
  const monthStart = useMemo(
    () => startOfMonth(monthBaseDate),
    [monthBaseDate]
  );
  const monthGridStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const monthDays = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i)),
    [monthGridStart]
  );

  /* ---------- Load from Supabase ---------- */

  async function fetchData() {
    setLoading(true);

    const [
      { data: linesData, error: linesError },
      { data: studentsData, error: studentsError },
      { data: bookingsData, error: bookingsError },
      { data: billingTagData, error: billingTagError },
      { data: courseTypeData, error: courseTypeError },
    ] = await Promise.all([
      supabase.from("lines").select("id, name").order("name"),
      supabase
        .from("students")
        .select("id, full_name, email, phone, notes")
        .order("full_name"),
      supabase
        .from("bookings")
        .select(
          "id, line_id, student_id, course_type, start_date, end_date, billing_tag, note, students(full_name,email)"
        )
        .order("start_date", { ascending: true }),
      supabase
        .from("billing_tags")
        .select("id, name, description")
        .order("name"),
      supabase
        .from("course_types")
        .select("id, name, description, weekly_capacity")
        .order("name"),
    ]);

    if (linesError) console.error("Error loading lines:", linesError.message);
    if (studentsError)
      console.error("Error loading students:", studentsError.message);
    if (bookingsError)
      console.error("Error loading bookings:", bookingsError.message);
    if (billingTagError)
      console.error("Error loading billing tags:", billingTagError.message);
    if (courseTypeError)
      console.error("Error loading course types:", courseTypeError.message);

    if (linesData) setLines(linesData as Line[]);
    if (studentsData) setStudents(studentsData as Student[]);
    if (billingTagData) setBillingTags(billingTagData as BillingTag[]);
    if (courseTypeData) setCourseTypes(courseTypeData as CourseType[]);

    if (bookingsData) {
      const normalized = (bookingsData as any[]).map((b) => ({
        ...b,
        start_date: normalizeDateString(b.start_date)!,
        end_date: normalizeDateString(b.end_date)!,
        students: Array.isArray(b.students)
          ? b.students[0] ?? null
          : b.students ?? null,
      })) as Booking[];

      setBookings(normalized);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------- Load actions for a booking ---------- */

  async function loadActionsForBooking(bookingId: string) {
    setActionsLoading(true);
    const { data, error } = await supabase
      .from("actions")
      .select("id, booking_id, title, due_date, completed, history")
      .eq("booking_id", bookingId)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error loading actions:", error.message);
      setBookingActions([]);
    } else {
      setBookingActions((data as ActionItem[]) || []);
    }
    setActionsLoading(false);
  }

  async function logBookingHistory(bookingId: string, description: string) {
    if (!bookingId) return;
    const { error } = await supabase
      .from("booking_history")
      .insert({ booking_id: bookingId, description });
    if (error) {
      console.error("Error writing booking history:", error.message);
    }
  }

  async function loadHistoryForBooking(bookingId: string) {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("booking_history")
      .select("id, booking_id, created_at, description")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading booking history:", error.message);
      setBookingHistory([]);
    } else {
      setBookingHistory((data || []) as BookingHistoryItem[]);
    }
    setHistoryLoading(false);
  }

  /* ---------- Filters / derived ---------- */

  const courseTypeOptions = useMemo(
    () =>
      Array.from(new Set(bookings.map((b) => b.course_type))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [bookings]
  );

  const billingTagOptions = useMemo(
    () =>
      Array.from(
        new Set(bookings.map((b) => b.billing_tag || "").filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [bookings]
  );

  const visibleLines = useMemo(
    () =>
      lines.filter(
        (line) => filterLineId === "all" || line.id === filterLineId
      ),
    [lines, filterLineId]
  );

  const filteredBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (filterLineId !== "all" && b.line_id !== filterLineId) return false;
        if (filterCourseType && b.course_type !== filterCourseType)
          return false;
        if (filterBillingTag && (b.billing_tag || "") !== filterBillingTag)
          return false;
        return true;
      }),
    [bookings, filterLineId, filterCourseType, filterBillingTag]
  );

  const courseTypeChipLabels = useMemo(() => {
    const fromDb = courseTypes.map((ct) => ct.name);
    if (fromDb.length > 0) return fromDb;

    // fallback to the hard-coded presets if the table is empty
    return COURSE_TYPE_PRESETS;
  }, [courseTypes]);

  const weeklyCapacitySummary = useMemo(
    () =>
      courseTypes
        .filter((ct) => ct.weekly_capacity != null && ct.weekly_capacity > 0)
        .map((ct) => ({
          name: ct.name,
          capacity: ct.weekly_capacity as number,
          booked: weeklyBookingCountsByCourseType[ct.name] || 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [courseTypes, weeklyBookingCountsByCourseType]
  );

  /* ---------- Booking panel helpers ---------- */

  function resetNewStudentFields() {
    setNewStudentName("");
    setNewStudentEmail("");
    setNewStudentPhone("");
    setNewStudentNotes("");
  }

  function openCreatePanel(lineId: string, date: Date) {
    const defaultStudentId = students[0]?.id ?? "";

    setPanelMode("create");
    setActiveBooking(null);
    setActiveTab("student");
    setDraft({
      line_id: lineId,
      student_id: defaultStudentId,
      course_type: "",
      billing_tag: "",
      start_date: toLocalISODate(date),
      end_date: toLocalISODate(date),
      note: "",
    });

    setBookingActions([]);
    setBookingHistory([]);
    setNewActionTitle("");
    setNewActionDueDate("");
    resetNewStudentFields();
    setPanelOpen(true);
  }

  function openEditPanel(booking: Booking) {
    setPanelMode("edit");
    setActiveBooking(booking);
    setActiveTab("student");

    setDraft({
      id: booking.id,
      line_id: booking.line_id,
      student_id: booking.student_id,
      course_type: booking.course_type,
      billing_tag: booking.billing_tag ?? "",
      start_date: booking.start_date,
      end_date: booking.end_date,
      note: booking.note ?? "",
    });

    resetNewStudentFields();
    setNewActionTitle("");
    setNewActionDueDate("");
    setPanelOpen(true);

    loadActionsForBooking(booking.id);
    loadHistoryForBooking(booking.id);
  }

  function closePanel() {
    setPanelOpen(false);
    setDraft(null);
    setActiveBooking(null);

    setBookingActions([]);
    setBookingHistory([]);
    setNewActionTitle("");
    setNewActionDueDate("");
    resetNewStudentFields();
  }

  function updateDraft<K extends keyof BookingFormState>(
    field: K,
    value: BookingFormState[K]
  ) {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSave() {
    if (!draft) return;

    setSaving(true);

    // Decide which student to use
    let studentId = draft.student_id;

    if (newStudentName.trim()) {
      const { data: newStudent, error: newStudentError } = await supabase
        .from("students")
        .insert({
          full_name: newStudentName.trim(),
          email: newStudentEmail || null,
          phone: newStudentPhone || null,
          notes: newStudentNotes || null,
        })
        .select()
        .single();

      if (newStudentError) {
        console.error("Error creating student:", newStudentError.message);
        alert("Could not create the new student. Check the console.");
        setSaving(false);
        return;
      }

      studentId = (newStudent as any).id as string;
    }

    if (!studentId) {
      alert("Please select a student or create a new one.");
      setSaving(false);
      return;
    }

    if (!draft.start_date || !draft.end_date) {
      alert("Please choose start and end dates.");
      setSaving(false);
      return;
    }

    const payload = {
      line_id: draft.line_id,
      student_id: studentId,
      course_type: draft.course_type || "Course",
      start_date: draft.start_date,
      end_date: draft.end_date,
      billing_tag: draft.billing_tag || null,
      note: draft.note || null,
    };

    let error: any;
    let savedBookingId: string | undefined;

    if (panelMode === "create") {
      const { data, error: insertError } = await supabase
        .from("bookings")
        .insert(payload)
        .select()
        .single();

      error = insertError;

      if (!insertError && data) {
        savedBookingId = (data as any).id as string;
        await logBookingHistory(
          savedBookingId,
          `Booking created for student ${
            selectedStudent?.full_name || "N/A"
          }: ${payload.course_type} (${payload.start_date} → ${
            payload.end_date
          })`
        );
      }
    } else {
      const bookingId = draft.id!;
      savedBookingId = bookingId;

      // Build change descriptions vs the original booking
      const changes: string[] = [];

      if (activeBooking) {
        if (activeBooking.course_type !== payload.course_type) {
          changes.push(
            `Course type changed from "${activeBooking.course_type}" to "${payload.course_type}".`
          );
        }
        if (activeBooking.billing_tag !== payload.billing_tag) {
          changes.push(
            `Billing tag changed from "${
              activeBooking.billing_tag || "None"
            }" to "${payload.billing_tag || "None"}".`
          );
        }
        if (activeBooking.start_date !== payload.start_date) {
          changes.push(
            `Start date changed from ${activeBooking.start_date} to ${payload.start_date}.`
          );
        }
        if (activeBooking.end_date !== payload.end_date) {
          changes.push(
            `End date changed from ${activeBooking.end_date} to ${payload.end_date}.`
          );
        }
        if ((activeBooking.note || "") !== (payload.note || "")) {
          changes.push("Notes updated.");
        }
      }

      const { error: updateError } = await supabase
        .from("bookings")
        .update(payload)
        .eq("id", bookingId);

      error = updateError;

      if (!updateError && changes.length > 0) {
        await Promise.all(
          changes.map((desc) => logBookingHistory(bookingId, desc))
        );
      }
    }

    setSaving(false);

    if (error) {
      console.error("Error saving booking:", error.message);
      alert("There was an error saving the booking. Check the console.");
      return;
    }

    await fetchData();
    closePanel();
  }

  async function handleDeleteBooking() {
    if (!draft?.id) return;
    const sure = window.confirm(
      "Are you sure you want to delete this booking and all its actions?"
    );
    if (!sure) return;

    // delete actions for this booking
    const { error: actionsError } = await supabase
      .from("actions")
      .delete()
      .eq("booking_id", draft.id);

    if (actionsError) {
      console.error("Error deleting actions:", actionsError.message);
      alert("Could not delete actions; see console.");
      return;
    }

    const { error: bookingError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", draft.id);

    if (bookingError) {
      console.error("Error deleting booking:", bookingError.message);
      alert("Could not delete booking; see console.");
      return;
    }
    await logBookingHistory(draft.id, "Booking deleted.");

    await fetchData();
    closePanel();
  }

  /* ---------- Action handlers ---------- */

  async function handleAddAction() {
    if (!draft?.id) {
      alert("Save the booking first, then add actions.");
      return;
    }
    if (!newActionTitle.trim()) {
      alert("Action title is required.");
      return;
    }

    setActionsLoading(true);
    const { error } = await supabase.from("actions").insert({
      booking_id: draft.id,
      title: newActionTitle.trim(),
      due_date: newActionDueDate || null,
      completed: false,
      history: [],
    });

    if (error) {
      console.error("Error adding action:", error.message);
      alert("Could not add action; see console.");
      setActionsLoading(false);
      return;
    }

    setNewActionTitle("");
    setNewActionDueDate("");
    await loadActionsForBooking(draft.id);
    await logBookingHistory(
      draft.id,
      `Action added: "${newActionTitle.trim()}"` +
        (newActionDueDate ? ` (due ${newActionDueDate})` : "")
    );
    setActionsLoading(false);
  }

  async function toggleActionCompleted(action: ActionItem) {
    const { error } = await supabase
      .from("actions")
      .update({ completed: !action.completed })
      .eq("id", action.id);

    if (error) {
      console.error("Error updating action:", error.message);
      alert("Could not update action completion; see console.");
      return;
    }

    if (draft?.id) {
      await loadActionsForBooking(draft.id);
      await logBookingHistory(
        draft.id,
        `Action "${action.title}" marked ${
          !action.completed ? "completed" : "incomplete"
        }.`
      );
    }
  }

  async function deleteAction(actionId: string) {
    if (!confirm("Delete this action?")) return;

    const { error } = await supabase
      .from("actions")
      .delete()
      .eq("id", actionId);

    if (error) {
      console.error("Error deleting action:", error.message);
      alert("Could not delete action; see console.");
      return;
    }

    if (draft?.id) {
      await loadActionsForBooking(draft.id);
      await logBookingHistory(draft.id, `Action deleted: "${actionId}".`);
    }
  }

  /* ---------- Line CRUD ---------- */

  async function handleAddLine() {
    const name = window.prompt(
      "Enter name for the new line (e.g. CFI Line – Isaac):"
    );
    if (!name) return;

    const { error } = await supabase.from("lines").insert({ name });

    if (error) {
      console.error("Error adding line:", error.message);
      alert("Could not add line; see console.");
      return;
    }

    await fetchData();
  }

  function startEditLine(line: Line) {
    setEditingLineId(line.id);
    setEditingLineName(line.name);
  }

  async function saveEditLine() {
    if (!editingLineId) return;
    const trimmed = editingLineName.trim();
    if (!trimmed) {
      alert("Line name cannot be empty.");
      return;
    }

    const { error } = await supabase
      .from("lines")
      .update({ name: trimmed })
      .eq("id", editingLineId);

    if (error) {
      console.error("Error renaming line:", error.message);
      alert("Could not rename line; see console.");
      return;
    }

    setEditingLineId(null);
    setEditingLineName("");
    await fetchData();
  }

  function cancelEditLine() {
    setEditingLineId(null);
    setEditingLineName("");
  }

  async function handleDeleteLine(line: Line) {
    const sure = window.confirm(
      `Are you sure you want to delete the line "${line.name}" and all bookings/actions on it?`
    );
    if (!sure) return;

    // Find bookings for this line
    const { data: lineBookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select("id")
      .eq("line_id", line.id);

    if (bookingsErr) {
      console.error("Error fetching line bookings:", bookingsErr.message);
      alert("Could not fetch bookings for line; see console.");
      return;
    }

    const bookingIds = (lineBookings || []).map((b: any) => b.id);

    if (bookingIds.length > 0) {
      // Delete actions attached to those bookings
      const { error: actionsErr } = await supabase
        .from("actions")
        .delete()
        .in("booking_id", bookingIds);

      if (actionsErr) {
        console.error("Error deleting actions for line:", actionsErr.message);
        alert("Could not delete actions for line; see console.");
        return;
      }

      // Delete bookings for this line
      const { error: delBookingsErr } = await supabase
        .from("bookings")
        .delete()
        .in("id", bookingIds);

      if (delBookingsErr) {
        console.error(
          "Error deleting bookings for line:",
          delBookingsErr.message
        );
        alert("Could not delete bookings for line; see console.");
        return;
      }
    }

    const { error: delLineErr } = await supabase
      .from("lines")
      .delete()
      .eq("id", line.id);

    if (delLineErr) {
      console.error("Error deleting line:", delLineErr.message);
      alert("Could not delete line; see console.");
      return;
    }

    await fetchData();
  }

  /* ---------- Render ---------- */

  const selectedStudent =
    draft && draft.student_id
      ? students.find((s) => s.id === draft.student_id) || null
      : null;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50">
      <div className="max-w-6xl mx-auto py-6 px-4 space-y-4">
        {/* Header + view controls */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Booking Calendar</h1>
            <p className="text-sm text-slate-300">
              {viewMode === "week"
                ? "Week view (Mon–Sun). Click an empty cell to create a booking or a colored block to view/edit details and actions."
                : "Month overview. Click any day to jump to that week and edit bookings."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* View toggle */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={
                  "px-3 py-1 text-xs rounded-md border " +
                  (viewMode === "week"
                    ? "bg-sky-500 border-sky-400 text-slate-900"
                    : "bg-slate-900 border-slate-600 text-slate-200 hover:bg-slate-800")
                }
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={
                  "px-3 py-1 text-xs rounded-md border " +
                  (viewMode === "month"
                    ? "bg-sky-500 border-sky-400 text-slate-900"
                    : "bg-slate-900 border-slate-600 text-slate-200 hover:bg-slate-800")
                }
              >
                Month
              </button>
            </div>

            {/* Navigation controls (week vs month) */}
            {viewMode === "week" ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-300">Week of</span>
                <input
                  type="date"
                  className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs"
                  value={toLocalISODate(weekBaseDate)}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const d = new Date(e.target.value + "T00:00:00");
                    if (!Number.isNaN(d.getTime())) setWeekBaseDate(d);
                  }}
                />
                <button
                  onClick={() => setWeekBaseDate(addDays(weekBaseDate, -7))}
                  className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
                >
                  ← Previous week
                </button>
                <button
                  onClick={() => setWeekBaseDate(new Date())}
                  className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
                >
                  This week
                </button>
                <button
                  onClick={() => setWeekBaseDate(addDays(weekBaseDate, 7))}
                  className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
                >
                  Next week →
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-300">
                  {monthStart.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() => setMonthBaseDate(addMonths(monthBaseDate, -1))}
                  className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
                >
                  ← Previous month
                </button>
                <button
                  onClick={() => setMonthBaseDate(new Date())}
                  className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
                >
                  This month
                </button>
                <button
                  onClick={() => setMonthBaseDate(addMonths(monthBaseDate, 1))}
                  className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
                >
                  Next month →
                </button>
              </div>
            )}
            {viewMode === "week" && weeklyCapacitySummary.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1 text-[11px]">
                {weeklyCapacitySummary.map((item) => {
                  const over = item.booked > item.capacity;
                  const full = item.booked === item.capacity;

                  const classes = over
                    ? "bg-red-500/20 border-red-400 text-red-200"
                    : full
                    ? "bg-amber-500/20 border-amber-400 text-amber-200"
                    : "bg-emerald-500/15 border-emerald-500/70 text-emerald-200";

                  return (
                    <span
                      key={item.name}
                      className={`px-2 py-1 rounded-full border ${classes}`}
                    >
                      {item.name}: {item.booked} / {item.capacity}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3">
              <Link
                href="/todo"
                className="text-xs text-slate-300 hover:text-white underline"
              >
                View To-Do list
              </Link>
              <Link
                href="/settings"
                className="text-xs text-slate-300 hover:text-white underline"
              >
                Setup & tags
              </Link>
              <Link
                href="/"
                className="text-xs text-slate-300 hover:text-white underline"
              >
                ← Back to dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Filters + Add line */}
        <section className="flex flex-wrap gap-3 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-slate-300">Line</span>
            <select
              className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
              value={filterLineId}
              onChange={(e) =>
                setFilterLineId(
                  e.target.value === "all" ? "all" : e.target.value
                )
              }
            >
              <option value="all">All lines</option>
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-slate-300">Course type</span>
            <select
              className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
              value={filterCourseType}
              onChange={(e) => setFilterCourseType(e.target.value)}
            >
              <option value="">All</option>
              {courseTypeOptions.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-slate-300">Billing tag</span>
            <select
              className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
              value={filterBillingTag}
              onChange={(e) => setFilterBillingTag(e.target.value)}
            >
              <option value="">All</option>
              {billingTagOptions.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddLine}
            className="ml-auto px-3 py-1 rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400"
          >
            + Add line
          </button>
        </section>

        {/* WEEK vs MONTH layout */}
        {viewMode === "week" ? (
          <>
            {/* Day headers (week) */}
            <div className="grid grid-cols-[260px_repeat(7,minmax(0,1fr))] text-xs font-semibold border-b border-slate-700">
              <div className="px-2 py-2 bg-slate-800">Line</div>
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className="px-2 py-2 text-center bg-slate-800/70"
                >
                  {formatDayLabel(day)}
                </div>
              ))}
            </div>

            {/* Grid (week) */}
            <div className="space-y-1">
              {loading ? (
                <div className="px-2 py-4 text-slate-300">
                  Loading lines and bookings…
                </div>
              ) : visibleLines.length === 0 ? (
                <div className="px-2 py-4 text-slate-300">
                  No lines match your filters. Adjust filters or add rows in the{" "}
                  <code>lines</code> table.
                </div>
              ) : (
                visibleLines.map((line) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-[260px_repeat(7,minmax(0,1fr))] text-xs border-b border-slate-800"
                  >
                    {/* Line label + edit/delete */}
                    <div className="px-2 py-2 bg-slate-800/80 font-medium flex items-center gap-2">
                      {editingLineId === line.id ? (
                        <>
                          <input
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs"
                            value={editingLineName}
                            onChange={(e) => setEditingLineName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditLine();
                              if (e.key === "Escape") cancelEditLine();
                            }}
                          />
                          <button
                            className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-900"
                            onClick={saveEditLine}
                          >
                            Save
                          </button>
                          <button
                            className="text-[11px] px-1.5 py-0.5 rounded border border-slate-600"
                            onClick={cancelEditLine}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 truncate">{line.name}</span>
                          <button
                            className="text-[11px] text-slate-300 hover:text-white"
                            onClick={() => startEditLine(line)}
                            title="Rename line"
                          >
                            ✏️
                          </button>
                          <button
                            className="text-[11px] text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteLine(line)}
                            title="Delete line"
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>

                    {/* Day cells */}
                    {dayKeys.map((dayKey, dayIdx) => {
                      const booking = filteredBookings.find((b) => {
                        if (b.line_id !== line.id) return false;
                        const startStr = normalizeDateString(b.start_date);
                        const endStr = normalizeDateString(b.end_date);
                        if (!startStr || !endStr) return false;
                        return dayKey >= startStr && dayKey <= endStr;
                      });

                      const dayDate = days[dayIdx];

                      return (
                        <div
                          key={dayKey}
                          className="h-16 border-l border-slate-800 bg-slate-900/40 relative cursor-pointer hover:bg-slate-800/40 transition"
                          onClick={() => {
                            if (!booking) {
                              openCreatePanel(line.id, dayDate);
                            }
                          }}
                        >
                          {booking && (
                            <div
                              className="absolute inset-1 rounded-md bg-emerald-500/80 text-slate-900 text-[11px] p-1 flex flex-col justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditPanel(booking);
                              }}
                            >
                              <span className="font-semibold truncate">
                                {booking.students?.full_name ?? "Student"}
                              </span>
                              <span className="truncate">
                                {booking.course_type}
                              </span>
                              {booking.billing_tag && (
                                <span className="truncate text-[10px]">
                                  {booking.billing_tag}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* MONTH VIEW */}
            <div className="grid grid-cols-7 text-xs font-semibold border-b border-slate-700">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="px-2 py-2 text-center bg-slate-800/70">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-800 mt-1 text-xs">
              {monthDays.map((day) => {
                const dayKey = toLocalISODate(day);
                const isCurrentMonth = day.getMonth() === monthStart.getMonth();
                const isToday =
                  toLocalISODate(day) === toLocalISODate(new Date());

                const bookingsForDay = filteredBookings.filter((b) => {
                  const startStr = normalizeDateString(b.start_date);
                  const endStr = normalizeDateString(b.end_date);
                  if (!startStr || !endStr) return false;
                  return dayKey >= startStr && dayKey <= endStr;
                });

                return (
                  <button
                    key={dayKey}
                    type="button"
                    className={
                      "h-20 bg-slate-900/60 p-1 text-left align-top hover:bg-slate-800 transition flex flex-col" +
                      (isCurrentMonth ? "" : " opacity-40") +
                      (isToday ? " ring-1 ring-sky-500" : "")
                    }
                    onClick={() => {
                      // Jump to the week containing this day
                      setWeekBaseDate(day);
                      setViewMode("week");
                    }}
                  >
                    <span className="text-[11px] font-semibold">
                      {day.getDate()}
                    </span>
                    {bookingsForDay.length > 0 && (
                      <div className="mt-1 space-y-0.5 text-[10px] text-emerald-300">
                        {Object.entries(
                          bookingsForDay.reduce((acc, b) => {
                            const type = b.course_type || "Course";
                            acc[type] = (acc[type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => {
                          const short =
                            type.length > 9
                              ? type.slice(0, 9).trimEnd() + "…"
                              : type;

                          return (
                            <div key={type} className="truncate">
                              {short} x{count}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Detail drawer */}
      {panelOpen && draft && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-700 p-4 flex flex-col h-screen overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                {panelMode === "create" ? "Create booking" : "Booking details"}
              </h2>
              <button
                onClick={closePanel}
                className="text-sm text-slate-300 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            {/* Line selector always visible */}
            <div className="mb-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-slate-300">Line</span>
                <select
                  className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
                  value={draft.line_id}
                  onChange={(e) => updateDraft("line_id", e.target.value)}
                >
                  {lines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700 text-sm mb-3">
              {[
                { id: "student", label: "Student info" },
                { id: "tags", label: "Tags & dates" },
                { id: "actions", label: "Actions" },
                { id: "history", label: "History" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.id as "student" | "tags" | "actions" | "history"
                    )
                  }
                  className={
                    "px-3 py-2 -mb-px border-b-2 text-xs font-medium transition-colors " +
                    (activeTab === tab.id
                      ? "border-sky-500 text-sky-400"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500")
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 flex flex-col gap-3 text-sm">
              {/* STUDENT INFO TAB */}
              {activeTab === "student" && (
                <div className="flex flex-col gap-3">
                  {/* Existing student select */}
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-300">Student (existing)</span>
                    <select
                      className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
                      value={draft.student_id}
                      onChange={(e) =>
                        updateDraft("student_id", e.target.value)
                      }
                    >
                      <option value="">Select student…</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                          {s.email ? ` (${s.email})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Selected student summary */}
                  {selectedStudent && (
                    <div className="text-[11px] text-slate-300 bg-slate-800/50 rounded-md px-2 py-2 space-y-1">
                      <div>
                        <span className="font-semibold">
                          {selectedStudent.full_name}
                        </span>
                      </div>
                      {selectedStudent.email && (
                        <div>Email: {selectedStudent.email}</div>
                      )}
                      {selectedStudent.phone && (
                        <div>Phone: {selectedStudent.phone}</div>
                      )}
                      {selectedStudent.notes && (
                        <div className="text-slate-400">
                          Notes: {selectedStudent.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* New student inline intake */}
                  <div className="mt-1 space-y-2 border border-slate-700 rounded-md p-2 bg-slate-800/40 text-xs">
                    <p className="text-slate-300 font-semibold">
                      Or create new student
                    </p>
                    <label className="flex flex-col gap-1">
                      <span className="text-slate-300">Full name</span>
                      <input
                        className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="John Smith"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-300">Email</span>
                        <input
                          className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
                          value={newStudentEmail}
                          onChange={(e) => setNewStudentEmail(e.target.value)}
                          placeholder="john@example.com"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-300">Phone</span>
                        <input
                          className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
                          value={newStudentPhone}
                          onChange={(e) => setNewStudentPhone(e.target.value)}
                          placeholder="555-555-5555"
                        />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1">
                      <span className="text-slate-300">Student notes</span>
                      <textarea
                        className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 min-h-[50px]"
                        value={newStudentNotes}
                        onChange={(e) => setNewStudentNotes(e.target.value)}
                        placeholder="Scheduling constraints, lodging, etc."
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">
                      If you type a new student name here, a new student record
                      will be created and used for this booking when you save.
                    </p>
                  </div>
                </div>
              )}

              {/* TAGS & DATES TAB */}
              {activeTab === "tags" && (
                <div className="flex flex-col gap-3">
                  {/* Course type & chips */}
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-300">Course type</span>
                    <input
                      className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
                      value={draft.course_type}
                      onChange={(e) =>
                        updateDraft("course_type", e.target.value)
                      }
                      placeholder="e.g. CFI 10-day, Instrument Finish-Up"
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      {courseTypeChipLabels.map((ct) => (
                        <button
                          key={ct}
                          type="button"
                          className={`px-2 py-1 text-[11px] rounded-full border ${
                            draft.course_type === ct
                              ? "bg-sky-500 border-sky-400 text-slate-900"
                              : "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
                          }`}
                          onClick={() => updateDraft("course_type", ct)}
                        >
                          {ct}
                        </button>
                      ))}
                    </div>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-slate-300">Start date</span>
                      <input
                        type="date"
                        className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
                        value={draft.start_date}
                        onChange={(e) =>
                          updateDraft("start_date", e.target.value)
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-slate-300">End date</span>
                      <input
                        type="date"
                        className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
                        value={draft.end_date}
                        onChange={(e) =>
                          updateDraft("end_date", e.target.value)
                        }
                      />
                    </label>
                  </div>

                  {/* Billing tag: free text + chips */}
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-300">Billing tag</span>
                    <input
                      className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
                      value={draft.billing_tag}
                      onChange={(e) =>
                        updateDraft("billing_tag", e.target.value)
                      }
                      placeholder="e.g. Downpayment invoiced, Paid in full"
                    />
                    {billingTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {billingTags.map((tag) => {
                          const isSelected = draft.billing_tag === tag.name;
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() =>
                                updateDraft("billing_tag", tag.name)
                              }
                              className={
                                "px-3 py-1 rounded-full border text-[11px] transition-colors " +
                                (isSelected
                                  ? "bg-emerald-500 text-slate-900 border-emerald-400"
                                  : "bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700")
                              }
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Booking notes */}
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-300">Notes</span>
                    <textarea
                      className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1 min-h-[80px]"
                      value={draft.note}
                      onChange={(e) => updateDraft("note", e.target.value)}
                      placeholder="Any special details about this booking…"
                    />
                  </label>
                </div>
              )}

              {/* ACTIONS TAB */}
              {activeTab === "actions" && (
                <div className="flex flex-col gap-2">
                  {panelMode !== "edit" ? (
                    <p className="text-xs text-slate-400">
                      Save this booking first, then you can attach actions /
                      to-dos.
                    </p>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold">
                        Actions / To-Dos for this booking
                      </h3>

                      {actionsLoading ? (
                        <p className="text-xs text-slate-400">
                          Loading actions…
                        </p>
                      ) : bookingActions.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          No actions yet. Use the form below to add to-dos for
                          this booking.
                        </p>
                      ) : (
                        <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {bookingActions.map((a) => (
                            <li
                              key={a.id}
                              className="flex items-center justify-between gap-2 text-xs bg-slate-800/70 rounded-md px-2 py-1"
                            >
                              <label className="flex items-center gap-2 flex-1">
                                <input
                                  type="checkbox"
                                  checked={a.completed}
                                  onChange={() => toggleActionCompleted(a)}
                                />
                                <span
                                  className={
                                    "truncate" +
                                    (a.completed
                                      ? " line-through text-slate-400"
                                      : "")
                                  }
                                >
                                  {a.title}
                                </span>
                              </label>
                              <span className="text-[10px] text-slate-300">
                                {a.due_date ?? ""}
                              </span>
                              <button
                                className="text-[10px] text-red-300 hover:text-red-400"
                                onClick={() => deleteAction(a.id)}
                              >
                                Delete
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* New action */}
                      <div className="flex flex-col gap-2 text-xs mt-2">
                        <span className="text-slate-300">Add action</span>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
                            placeholder="e.g. Send welcome email, invoice downpayment"
                            value={newActionTitle}
                            onChange={(e) => setNewActionTitle(e.target.value)}
                          />
                          <input
                            type="date"
                            className="w-32 bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
                            value={newActionDueDate}
                            onChange={(e) =>
                              setNewActionDueDate(e.target.value)
                            }
                          />
                        </div>
                        <button
                          onClick={handleAddAction}
                          className="self-start px-3 py-1 rounded-md bg-sky-500 text-slate-900 font-semibold hover:bg-sky-400 disabled:opacity-60"
                          disabled={actionsLoading || panelMode !== "edit"}
                        >
                          Add action
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <div className="flex flex-col gap-2 text-xs">
                {panelMode !== "edit" ? (
                  <p className="text-slate-400">
                    History appears after the booking has been created.
                  </p>
                ) : historyLoading ? (
                  <p className="text-slate-400">Loading history…</p>
                ) : bookingHistory.length === 0 ? (
                  <p className="text-slate-400">
                    No history yet for this booking.
                  </p>
                ) : (
                  <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    {bookingHistory.map((h) => (
                      <li
                        key={h.id}
                        className="bg-slate-800/60 border border-slate-700 rounded-md px-2 py-1"
                      >
                        <div className="text-[10px] text-slate-400">
                          {new Date(h.created_at).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-100">
                          {h.description}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Footer buttons */}
            <div className="mt-4 flex justify-between gap-2 pb-2">
              {panelMode === "edit" ? (
                <button
                  onClick={handleDeleteBooking}
                  className="px-3 py-1 text-sm rounded-md border border-red-500 text-red-300 hover:bg-red-500/10"
                >
                  Delete booking
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={closePanel}
                  className="px-3 py-1 text-sm rounded-md border border-slate-600 hover:bg-slate-800"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1 text-sm rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : panelMode === "create"
                    ? "Create booking"
                    : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
