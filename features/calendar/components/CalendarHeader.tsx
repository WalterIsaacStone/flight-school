// =============================================================================
// CalendarHeader - Title, View Toggle, Navigation (Presentational)
// =============================================================================

import Link from "next/link";
import { toDateString } from "@/lib/utils/dates";
import { CapacitySummary, type CapacityItem } from "./CapacitySummary";
import type { ViewMode } from "@/types";

type Props = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // Week navigation
  weekBaseDate: Date;
  onWeekDateChange: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;

  // Month navigation
  monthStart: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;

  // Capacity
  capacitySummary: CapacityItem[];
};

export function CalendarHeader({
  viewMode,
  onViewModeChange,
  weekBaseDate,
  onWeekDateChange,
  onPrevWeek,
  onNextWeek,
  onToday,
  monthStart,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  capacitySummary,
}: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">Booking Calendar</h1>
        <p className="text-sm text-slate-300">
          {viewMode === "week"
            ? "Week view (Mon–Sun). Click an empty cell to create a booking or a colored block to view/edit."
            : "Month overview. Click any day to jump to that week."}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        {/* View toggle */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onViewModeChange("week")}
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
            onClick={() => onViewModeChange("month")}
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

        {/* Navigation */}
        {viewMode === "week" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300">Week of</span>
            <input
              type="date"
              className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs"
              value={toDateString(weekBaseDate)}
              onChange={(e) => {
                if (!e.target.value) return;
                const d = new Date(e.target.value + "T00:00:00");
                if (!Number.isNaN(d.getTime())) onWeekDateChange(d);
              }}
            />
            <button
              onClick={onPrevWeek}
              className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
            >
              ← Prev
            </button>
            <button
              onClick={onToday}
              className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
            >
              Today
            </button>
            <button
              onClick={onNextWeek}
              className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
            >
              Next →
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
              onClick={onPrevMonth}
              className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
            >
              ← Prev
            </button>
            <button
              onClick={onCurrentMonth}
              className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
            >
              Today
            </button>
            <button
              onClick={onNextMonth}
              className="px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-800"
            >
              Next →
            </button>
          </div>
        )}

        {/* Capacity summary (week view only) */}
        {viewMode === "week" && <CapacitySummary items={capacitySummary} />}

        {/* Nav links */}
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
            ← Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
