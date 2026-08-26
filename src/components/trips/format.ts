import type { TripStatus } from "@/lib/trips/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parts(dateKey: string): { d: number; m: number; y: number } | null {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { d, m: m - 1, y };
}

/** "14–18 Oct 2026", collapsing a shared month and a single day. */
export function formatTripRange(start: string, end: string): string {
  const a = parts(start);
  const b = parts(end);
  if (!a || !b) return start;
  if (start === end) return `${a.d} ${MONTHS[a.m]} ${a.y}`;
  if (a.m === b.m && a.y === b.y) {
    return `${a.d}–${b.d} ${MONTHS[a.m]} ${a.y}`;
  }
  if (a.y === b.y) {
    return `${a.d} ${MONTHS[a.m]} – ${b.d} ${MONTHS[b.m]} ${a.y}`;
  }
  return `${a.d} ${MONTHS[a.m]} ${a.y} – ${b.d} ${MONTHS[b.m]} ${b.y}`;
}

/** "14 Oct" — for timeline rows. */
export function formatDayLabel(dateKey: string): string {
  const p = parts(dateKey);
  return p ? `${p.d} ${MONTHS[p.m]}` : dateKey;
}

/** Time of day for an experience, or null when it reads as midnight. */
export function formatTimeOfDay(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  if (h === 0 && m === 0) return null;
  const suffix = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0
    ? `${hour12}${suffix}`
    : `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

export const STATUS_LABEL: Record<TripStatus, string> = {
  upcoming: "Upcoming",
  in_progress: "In progress",
  past: "Completed",
  cancelled: "Cancelled",
};
