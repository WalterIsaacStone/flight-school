// =============================================================================
// FilterBar - Calendar Filters (Presentational)
// =============================================================================

import type { Line } from "@/types";

type Props = {
  lines: Line[];
  filterLineId: "all" | string;
  filterCourseType: string;
  filterBillingTag: string;
  courseTypeOptions: string[];
  billingTagOptions: string[];
  onLineChange: (id: "all" | string) => void;
  onCourseTypeChange: (type: string) => void;
  onBillingTagChange: (tag: string) => void;
  onAddLine: () => void;
};

export function FilterBar({
  lines,
  filterLineId,
  filterCourseType,
  filterBillingTag,
  courseTypeOptions,
  billingTagOptions,
  onLineChange,
  onCourseTypeChange,
  onBillingTagChange,
  onAddLine,
}: Props) {
  return (
    <section className="flex flex-wrap gap-3 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700 items-end">
      {/* Line filter */}
      <div className="flex flex-col gap-1">
        <span className="text-slate-300">Line</span>
        <select
          className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
          value={filterLineId}
          onChange={(e) =>
            onLineChange(e.target.value === "all" ? "all" : e.target.value)
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

      {/* Course type filter */}
      <div className="flex flex-col gap-1">
        <span className="text-slate-300">Course type</span>
        <select
          className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
          value={filterCourseType}
          onChange={(e) => onCourseTypeChange(e.target.value)}
        >
          <option value="">All</option>
          {courseTypeOptions.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>
      </div>

      {/* Billing tag filter */}
      <div className="flex flex-col gap-1">
        <span className="text-slate-300">Billing tag</span>
        <select
          className="bg-slate-900 border border-slate-600 rounded-md px-2 py-1"
          value={filterBillingTag}
          onChange={(e) => onBillingTagChange(e.target.value)}
        >
          <option value="">All</option>
          {billingTagOptions.map((bt) => (
            <option key={bt} value={bt}>
              {bt}
            </option>
          ))}
        </select>
      </div>

      {/* Add line button */}
      <button
        onClick={onAddLine}
        className="ml-auto px-3 py-1 rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400"
      >
        + Add line
      </button>
    </section>
  );
}
