/**
 * Pure date-range overlap logic. Phase 1B.5 Phase C.
 *
 * This mirrors the semantics of the PostgreSQL exclusion constraint (which is
 * the real, authoritative concurrency guard). Property stay windows are treated
 * as half-open [start, end): check-out day and the next check-in day do NOT
 * overlap. Keeping this here lets us unit-test the intent without a database and
 * lets the availability service pre-check before hitting the constraint.
 */
export type DateRange = { start: Date; end: Date };

/** Half-open overlap: [aStart,aEnd) ∩ [bStart,bEnd) ≠ ∅. */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Parse a YYYY-MM-DD date string to a UTC Date at midnight. */
export function parseDay(day: string): Date {
  const d = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`invalid date: ${day}`);
  return d;
}

/** Property blocking window [check_in, check_out). */
export function stayRange(checkIn: string, checkOut: string): DateRange {
  const start = parseDay(checkIn);
  const end = parseDay(checkOut);
  if (end <= start) throw new Error("check_out must be after check_in");
  return { start, end };
}

/** Nights between two YYYY-MM-DD days. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const { start, end } = stayRange(checkIn, checkOut);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}
