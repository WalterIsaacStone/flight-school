// =============================================================================
// MonthView - Month Grid Display (Presentational)
// =============================================================================

import { useMemo } from "react";
import { toDateString, normalizeDateString } from "@/lib/utils/dates";

type Booking = {
  id: string;
  start_date: string;
  end_date: string;
};

type Props = {
  monthDays: Date[];
  monthStart: Date;
  bookings: Booking[];
  onDayClick: (date: Date) => void;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthView({ monthDays, monthStart, bookings, onDayClick }: Props) {
  const currentMonth = monthStart.getMonth();
  const todayKey = toDateString(new Date());

  // Pre-compute booking counts by day
  const bookingCountByDay = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const b of bookings) {
      const startStr = normalizeDateString(b.start_date);
      const endStr = normalizeDateString(b.end_date);
      if (!startStr || !endStr) continue;

      // For each day the booking spans, increment count
      const start = new Date(startStr + "T00:00:00");
      const end = new Date(endStr + "T00:00:00");
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = toDateString(d);
        counts[key] = (counts[key] || 0) + 1;
      }
    }

    return counts;
  }, [bookings]);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 text-xs font-semibold text-center border-b border-slate-700">
        {DAY_NAMES.map((d) => (
          <div key={d} className="px-2 py-2 bg-slate-800">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {monthDays.map((day, idx) => {
          const dayKey = toDateString(day);
          const isCurrentMonth = day.getMonth() === currentMonth;
          const isToday = dayKey === todayKey;
          const bookingCount = bookingCountByDay[dayKey] || 0;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onDayClick(day)}
              className={`
                min-h-[70px] p-1.5 border-b border-r border-slate-700 
                text-left transition-colors hover:bg-slate-700/50
                ${!isCurrentMonth ? "bg-slate-900/50 text-slate-500" : ""}
                ${isToday ? "ring-2 ring-inset ring-sky-500" : ""}
              `}
            >
              <div className="flex justify-between items-start">
                <span
                  className={`
                    text-xs font-medium 
                    ${isToday ? "text-sky-400" : isCurrentMonth ? "text-slate-200" : "text-slate-500"}
                  `}
                >
                  {day.getDate()}
                </span>
                
                {bookingCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300">
                    {bookingCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
