// =============================================================================
// CapacitySummary - Weekly Capacity Badges (Presentational)
// =============================================================================

export type CapacityItem = {
  name: string;
  capacity: number;
  booked: number;
};

type Props = {
  items: CapacityItem[];
};

export function CapacitySummary({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-end gap-1 text-[11px]">
      {items.map((item) => {
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
            title={`${item.name}: ${item.booked} booked out of ${item.capacity} capacity`}
          >
            {item.name}: {item.booked} / {item.capacity}
          </span>
        );
      })}
    </div>
  );
}
