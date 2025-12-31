// =============================================================================
// WeekView - Week Grid Display (Presentational)
// =============================================================================

import { formatDayLabel } from "@/lib/utils/dates";
import { LineRow } from "./LineRow";
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
  days: Date[];
  dayKeys: string[];
  lines: Line[];
  bookings: Booking[];
  
  // Line editing state
  editingLineId: string | null;
  editingLineName: string;
  onEditingLineNameChange: (name: string) => void;
  onStartEditLine: (lineId: string, name: string) => void;
  onSaveEditLine: () => void;
  onCancelEditLine: () => void;
  onDeleteLine: (lineId: string, name: string) => void;
  
  // Cell interactions
  onCellClick: (lineId: string, dateKey: string) => void;
  onBookingClick: (booking: Booking) => void;
};

// Grid style for 8 columns: Line label + 7 days
const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "260px repeat(7, minmax(0, 1fr))",
} as const;

export function WeekView({
  days,
  dayKeys,
  lines,
  bookings,
  editingLineId,
  editingLineName,
  onEditingLineNameChange,
  onStartEditLine,
  onSaveEditLine,
  onCancelEditLine,
  onDeleteLine,
  onCellClick,
  onBookingClick,
}: Props) {
  if (lines.length === 0) {
    return (
      <div className="px-2 py-4 text-slate-300">
        No lines match your filters. Adjust filters or add a line.
      </div>
    );
  }

  return (
    <>
      {/* Day headers */}
      <div style={GRID_STYLE} className="text-xs font-semibold border-b border-slate-700">
        <div className="px-2 py-2 bg-slate-800">Line</div>
        {days.map((day, idx) => (
          <div key={idx} className="px-2 py-2 text-center bg-slate-800/70">
            {formatDayLabel(day)}
          </div>
        ))}
      </div>

      {/* Line rows */}
      <div className="space-y-1">
        {lines.map((line) => (
          <LineRow
            key={line.id}
            line={line}
            dayKeys={dayKeys}
            bookings={bookings}
            isEditing={editingLineId === line.id}
            editingName={editingLineName}
            onEditingNameChange={onEditingLineNameChange}
            onStartEdit={() => onStartEditLine(line.id, line.name)}
            onSaveEdit={onSaveEditLine}
            onCancelEdit={onCancelEditLine}
            onDeleteLine={() => onDeleteLine(line.id, line.name)}
            onCellClick={onCellClick}
            onBookingClick={onBookingClick}
          />
        ))}
      </div>
    </>
  );
}
