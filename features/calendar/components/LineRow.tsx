// =============================================================================
// LineRow - Single Line Row in Week View (Presentational)
// =============================================================================

import { useMemo } from "react";
import { BookingCell } from "./BookingCell";
import { normalizeDateString, isDateInRange } from "@/lib/utils/dates";
import type { Line } from "@/types";

type Booking = {
  id: string;
  line_id: string;
  student_id: string;
  course_type: string;
  start_date: string;
  end_date: string;
  billing_tag: string | null;
  note: string | null;
  students?: { full_name: string | null } | null;
};

type Props = {
  line: Line;
  dayKeys: string[];
  bookings: Booking[];
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteLine: () => void;
  onCellClick: (lineId: string, dateKey: string) => void;
  onBookingClick: (booking: Booking) => void;
};

// Grid style for 8 columns: Line label + 7 days
const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "260px repeat(7, minmax(0, 1fr))",
} as const;

// Cell style for day cells
const CELL_STYLE = {
  minHeight: "60px",
  borderLeft: "1px solid rgb(51, 65, 85)",
  backgroundColor: "rgba(30, 41, 59, 0.5)",
} as const;

export function LineRow({
  line,
  dayKeys,
  bookings,
  isEditing,
  editingName,
  onEditingNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteLine,
  onCellClick,
  onBookingClick,
}: Props) {
  const bookingsByDay = useMemo(() => {
    const map: Record<string, Booking[]> = {};

    for (const dayKey of dayKeys) {
      map[dayKey] = [];
    }

    const lineBookings = bookings.filter((b) => b.line_id === line.id);

    for (const b of lineBookings) {
      const startStr = normalizeDateString(b.start_date);
      const endStr = normalizeDateString(b.end_date);
      if (!startStr || !endStr) continue;

      for (const dayKey of dayKeys) {
        if (isDateInRange(dayKey, startStr, endStr)) {
          map[dayKey].push(b);
        }
      }
    }

    return map;
  }, [line.id, bookings, dayKeys]);

  return (
    <div style={GRID_STYLE} className="text-xs border-b border-slate-800">
      {/* Line label cell */}
      <div className="px-2 py-2 bg-slate-800/80 font-medium flex items-center gap-2">
        {isEditing ? (
          <>
            <input
              className="flex-1 bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs"
              value={editingName}
              onChange={(e) => onEditingNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              autoFocus
            />
            <button
              className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-900"
              onClick={onSaveEdit}
            >
              Save
            </button>
            <button
              className="text-[11px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-200"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="truncate flex-1">{line.name}</span>
            <button
              className="text-[10px] text-slate-400 hover:text-sky-300"
              onClick={onStartEdit}
              title="Rename line"
            >
              ✎
            </button>
            <button
              className="text-[10px] text-slate-400 hover:text-red-300"
              onClick={onDeleteLine}
              title="Delete line"
            >
              🗑
            </button>
          </>
        )}
      </div>

      {/* Day cells */}
      {dayKeys.map((dayKey) => {
        const dayBookings = bookingsByDay[dayKey] ?? [];

        return (
          <div
            key={dayKey}
            style={CELL_STYLE}
            className="px-1 py-1 cursor-pointer hover:bg-slate-700/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onCellClick(line.id, dayKey);
            }}
          >
            <div className="flex flex-col gap-0.5">
              {dayBookings.map((b) => (
                <BookingCell
                  key={b.id}
                  booking={b}
                  onClick={(booking) => {
                    onBookingClick(booking);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
