// =============================================================================
// Skeleton Loading Components
// =============================================================================

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-700/50 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-4 bg-slate-800/60 p-3 rounded-xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Day headers skeleton */}
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>

      {/* Grid rows skeleton */}
      {Array.from({ length: 4 }).map((_, row) => (
        <div key={row} className="grid grid-cols-8 gap-1">
          <Skeleton className="h-16" />
          {Array.from({ length: 7 }).map((_, col) => (
            <Skeleton key={col} className="h-16" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SettingsListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-slate-900/60 border border-slate-700 rounded-md px-3 py-2"
        >
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TodoListSkeleton() {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-5 bg-slate-800 px-3 py-2 rounded-t-xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className="grid grid-cols-5 px-3 py-2 border-t border-slate-800">
          {Array.from({ length: 5 }).map((_, col) => (
            <Skeleton key={col} className="h-4 w-20" />
          ))}
        </div>
      ))}
    </div>
  );
}
