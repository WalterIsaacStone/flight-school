// =============================================================================
// HistoryTab - Booking History Display (Presentational)
// =============================================================================

import type { BookingHistoryItem } from "@/types";

type Props = {
  isEditMode: boolean; // false = creating new booking, no history yet
  history: BookingHistoryItem[];
  historyLoading: boolean;
};

export function HistoryTab({ isEditMode, history, historyLoading }: Props) {
  if (!isEditMode) {
    return (
      <p className="text-xs text-slate-400">
        History appears after the booking has been created.
      </p>
    );
  }

  if (historyLoading) {
    return <p className="text-xs text-slate-400">Loading history…</p>;
  }

  if (history.length === 0) {
    return <p className="text-xs text-slate-400">No history yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2 text-xs">
      <h3 className="text-sm font-semibold">Booking History</h3>
      
      <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
        {history.map((item) => (
          <li
            key={item.id}
            className="bg-slate-800/60 border border-slate-700 rounded-md px-2 py-1.5"
          >
            <div className="text-[10px] text-slate-400">
              {formatDateTime(item.created_at)}
            </div>
            <div className="text-[11px] text-slate-100">{item.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Helper to format datetime nicely
function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
