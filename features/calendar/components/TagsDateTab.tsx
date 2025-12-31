// =============================================================================
// TagsDateTab - Course Type, Dates, Billing Tag, Notes (Presentational)
// =============================================================================

import type { BillingTag } from "@/types";
import type { BookingDraft } from "../schemas/booking";

type Props = {
  draft: BookingDraft;
  courseTypeChips: string[];
  billingTags: BillingTag[];
  onDraftChange: <K extends keyof BookingDraft>(field: K, value: BookingDraft[K]) => void;
};

export function TagsDateTab({
  draft,
  courseTypeChips,
  billingTags,
  onDraftChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Course type chips */}
      <div className="flex flex-col gap-2">
        <span className="text-slate-300">Course type</span>
        <div className="flex flex-wrap gap-2">
          {courseTypeChips.map((ct) => (
            <button
              key={ct}
              type="button"
              onClick={() => onDraftChange("course_type", ct)}
              className={
                "px-3 py-1.5 rounded-full border text-xs transition-colors " +
                (draft.course_type === ct
                  ? "bg-sky-500 text-slate-900 border-sky-400"
                  : "bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700")
              }
            >
              {ct}
            </button>
          ))}
        </div>
        {/* Custom course type input */}
        <input
          className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 mt-1"
          placeholder="Or type a custom course..."
          value={draft.course_type}
          onChange={(e) => onDraftChange("course_type", e.target.value)}
        />
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-slate-300">Start date</span>
          <input
            type="date"
            className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5"
            value={draft.start_date}
            onChange={(e) => onDraftChange("start_date", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-300">End date</span>
          <input
            type="date"
            className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5"
            value={draft.end_date}
            onChange={(e) => onDraftChange("end_date", e.target.value)}
          />
        </label>
      </div>

      {/* Date validation */}
      {draft.start_date && draft.end_date && draft.start_date > draft.end_date && (
        <p className="text-red-400 text-[11px]">
          ⚠ End date must be on or after start date
        </p>
      )}

      {/* Billing tag */}
      <div className="flex flex-col gap-2">
        <span className="text-slate-300">Billing tag</span>
        <input
          className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5"
          value={draft.billing_tag}
          onChange={(e) => onDraftChange("billing_tag", e.target.value)}
          placeholder="e.g. Paid in full, Deposit received..."
        />
        {billingTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {billingTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onDraftChange("billing_tag", tag.name)}
                className={
                  "px-3 py-1 rounded-full border text-[11px] transition-colors " +
                  (draft.billing_tag === tag.name
                    ? "bg-emerald-500 text-slate-900 border-emerald-400"
                    : "bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700")
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <label className="flex flex-col gap-1">
        <span className="text-slate-300">Notes</span>
        <textarea
          className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 min-h-[80px]"
          value={draft.note}
          onChange={(e) => onDraftChange("note", e.target.value)}
          placeholder="Any special details about this booking..."
        />
      </label>
    </div>
  );
}
