// =============================================================================
// Date Utilities
// =============================================================================
// All dates are stored as YYYY-MM-DD strings in the database.
// These utilities handle date manipulation without timezone issues.
// =============================================================================

/**
 * Get the Monday of the week containing the given date.
 */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day + 6) % 7; // Days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Add days to a date.
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Get the first day of the month.
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Add months to a date.
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Format a date for display (e.g., "Mon 12/25").
 */
export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
}

/**
 * Convert a Date to YYYY-MM-DD string.
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date (at midnight local time).
 */
export function parseDateString(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

/**
 * Normalize a date string to YYYY-MM-DD format (strips any time portion).
 */
export function normalizeDateString(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

/**
 * Check if a date string falls within a range (inclusive).
 */
export function isDateInRange(
  dateStr: string,
  startStr: string,
  endStr: string
): boolean {
  return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Check if two date ranges overlap.
 */
export function doRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 <= end2 && end1 >= start2;
}

/**
 * Get an array of dates for a week starting from a given Monday.
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/**
 * Get an array of dates for a month grid (42 days = 6 weeks).
 */
export function getMonthGridDays(monthStart: Date): Date[] {
  const gridStart = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}
