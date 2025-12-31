// =============================================================================
// BookingCell - Single Booking Chip Display (Presentational)
// =============================================================================

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
  booking: Booking;
  onClick: (booking: Booking) => void;
};

// Color mapping for course types
const COURSE_COLORS: Record<string, string> = {
  "CFI Initial – 10 Day": "bg-emerald-500/40 border-emerald-400/70",
  "CFII – 7 Day": "bg-sky-500/40 border-sky-400/70",
  "Instrument Finish-Up": "bg-amber-500/40 border-amber-400/70",
  "Commercial Finish-Up": "bg-violet-500/40 border-violet-400/70",
  "10-Day": "bg-rose-500/40 border-rose-400/70",
};

const DEFAULT_COLOR = "bg-slate-600/40 border-slate-500/70";

export function BookingCell({ booking, onClick }: Props) {
  const colorClass = COURSE_COLORS[booking.course_type] || DEFAULT_COLOR;
  const studentName = booking.students?.full_name || "Unknown";

  return (
    <button
      type="button"
      onClick={() => onClick(booking)}
      className={`w-full text-left px-1.5 py-0.5 rounded border text-[10px] truncate hover:brightness-110 transition-all ${colorClass}`}
      title={`${studentName} – ${booking.course_type}`}
    >
      {studentName}
    </button>
  );
}

// Export color utilities for use elsewhere
export function getBookingColor(courseType: string): string {
  return COURSE_COLORS[courseType] || DEFAULT_COLOR;
}
