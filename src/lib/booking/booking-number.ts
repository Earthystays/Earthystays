/**
 * Booking-number formatting. Phase 1B.5 Phase C.
 *
 * Format: ES-YYYYMMDD-NNNNNN  (e.g. ES-20260821-000001)
 * The NNNNNN sequence value is supplied by a PostgreSQL SEQUENCE inside the
 * booking transaction (concurrency-safe, monotonic). This module only formats;
 * uniqueness is guaranteed by the sequence + a UNIQUE constraint on the column.
 */
export function formatBookingNumber(seq: number, now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `ES-${y}${m}${d}-${String(seq).padStart(6, "0")}`;
}

/** Validate the canonical booking-number shape. */
export function isBookingNumber(s: string): boolean {
  return /^ES-\d{8}-\d{6}$/.test(s);
}
