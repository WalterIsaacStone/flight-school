"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useAllActions,
  useBookings,
  useLines,
  useStudents,
} from "@/hooks/useData";
import { TodoListSkeleton } from "@/components/ui/Skeleton";
import type { TodoFilter } from "@/types";

// =============================================================================
// Todo Page
// =============================================================================

export default function ToDoPage() {
  // Data fetching
  const { data: actions = [], isLoading: actionsLoading, error: actionsError } = useAllActions();
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { data: lines = [], isLoading: linesLoading } = useLines();
  const { data: students = [], isLoading: studentsLoading } = useStudents();

  // Filter state
  const [filterCompleted, setFilterCompleted] = useState<TodoFilter>("open");

  // Loading state
  const loading = actionsLoading || bookingsLoading || linesLoading || studentsLoading;

  // Create lookup maps for efficient rendering
  const bookingsById = useMemo(
    () => new Map(bookings.map((b) => [b.id, b])),
    [bookings]
  );

  const linesById = useMemo(
    () => new Map(lines.map((l) => [l.id, l])),
    [lines]
  );

  const studentsById = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );

  // Filter actions
  const visibleActions = useMemo(() => {
    return actions.filter((a) => {
      if (filterCompleted === "open") return !a.completed;
      if (filterCompleted === "done") return a.completed;
      return true;
    });
  }, [actions, filterCompleted]);

  // Error state
  if (actionsError) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error loading actions</h2>
          <p className="text-slate-300 mb-4">{actionsError.message}</p>
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

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50">
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">To-Do / Actions</h1>
            <p className="text-sm text-slate-300">
              All actions across bookings. This is your &quot;what needs to happen and when&quot; board.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs">
            <Link href="/calendar" className="text-slate-300 hover:text-white underline">
              ← Back to calendar
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white underline">
              Back to dashboard
            </Link>
          </div>
        </header>

        {/* Filter */}
        <div className="flex items-center gap-3 text-xs bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
          <span className="text-slate-300">Filter:</span>
          <select
            className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
            value={filterCompleted}
            onChange={(e) => setFilterCompleted(e.target.value as TodoFilter)}
          >
            <option value="open">Open only</option>
            <option value="all">All</option>
            <option value="done">Completed only</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <TodoListSkeleton />
        ) : visibleActions.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-300 text-sm">
              {filterCompleted === "open"
                ? "No open actions. Great job!"
                : filterCompleted === "done"
                ? "No completed actions yet."
                : "No actions found."}
            </p>
            <Link
              href="/calendar"
              className="inline-block mt-4 text-xs text-sky-400 hover:text-sky-300 underline"
            >
              Go to calendar to create bookings and actions
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden text-xs">
            {/* Header */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr_0.5fr] bg-slate-800 font-semibold px-3 py-2">
              <div>Action</div>
              <div>Student</div>
              <div>Line / Course</div>
              <div>Due date</div>
              <div>Status</div>
            </div>

            {/* Rows */}
            {visibleActions.map((a) => {
              const booking = bookingsById.get(a.booking_id);
              const line = booking ? linesById.get(booking.line_id) : undefined;
              const student = booking ? studentsById.get(booking.student_id) : undefined;

              return (
                <div
                  key={a.id}
                  className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr_0.5fr] px-3 py-2 border-t border-slate-800 hover:bg-slate-800/30"
                >
                  <div className={`pr-3 ${a.completed ? "line-through text-slate-500" : ""}`}>
                    {a.title}
                  </div>
                  <div className="text-slate-300">{student?.full_name ?? "—"}</div>
                  <div>
                    {line?.name ?? "—"}{" "}
                    {booking && (
                      <span className="text-slate-400">({booking.course_type})</span>
                    )}
                  </div>
                  <div className="text-slate-300">{a.due_date ?? "—"}</div>
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        a.completed
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {a.completed ? "Done" : "Open"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && actions.length > 0 && (
          <div className="flex gap-4 text-xs text-slate-400">
            <span>Total: {actions.length}</span>
            <span>Open: {actions.filter((a) => !a.completed).length}</span>
            <span>Completed: {actions.filter((a) => a.completed).length}</span>
          </div>
        )}
      </div>
    </main>
  );
}
