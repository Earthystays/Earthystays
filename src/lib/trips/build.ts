/**
 * Pure assembly of booking rows into trips.
 *
 * Deliberately free of database and filesystem access so it can be unit-tested
 * without a running Postgres. `store.ts` supplies the rows and the catalog
 * resolvers; everything here is a pure function of its inputs.
 */
import type {
  Trip,
  TripBuckets,
  TripExperience,
  TripStay,
  TripStatus,
  TripTimelineEntry,
} from "./types";

/** The subset of a booking row the trip view needs. */
export type BookingLike = {
  id: string;
  bookingNumber: string;
  kind: "property" | "experience";
  guestId: string;
  hostId: string;
  propertyId: string | null;
  experienceId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  experienceDate: Date | string | null;
  guestsCount: number;
  unitsCount: number;
  bookingStatus: string;
  paymentStatus: string;
};

/** Catalog lookups, injected so this module stays pure. */
export type TripResolvers = {
  property: (slug: string) => {
    name: string;
    href: string;
    image: { src: string; alt: string } | null;
    city: string | null;
    state: string | null;
    locationNote: string | null;
  } | null;
  experience: (slug: string) => {
    name: string;
    href: string;
    image: { src: string; alt: string } | null;
  } | null;
};

/* ─────────────────────────── date helpers ─────────────────────────── */

/** YYYY-MM-DD for a Date or ISO-ish string, without timezone drift. */
export function toDateKey(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateKey(d);
}

/** Whole days between two YYYY-MM-DD keys. */
export function nightsBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/* ─────────────────────────── classification ─────────────────────────── */

const CANCELLED_STATUSES = new Set(["CANCELLED", "EXPIRED"]);

export function classifyTrip(
  bookingStatus: string,
  start: string,
  end: string,
  todayKey: string,
): TripStatus {
  if (CANCELLED_STATUSES.has(bookingStatus)) return "cancelled";
  if (bookingStatus === "COMPLETED") return "past";
  if (bookingStatus === "CHECKED_IN") return "in_progress";
  if (end < todayKey) return "past";
  if (start <= todayKey && todayKey <= end) return "in_progress";
  return "upcoming";
}

/* ─────────────────────────── timeline ─────────────────────────── */

/**
 * Builds the day-by-day trip timeline: arrival, each experience on its day,
 * "free day" for gaps, and checkout. Only ever spans the real stay dates.
 */
export function buildTimeline(
  stay: TripStay | null,
  experiences: TripExperience[],
): TripTimelineEntry[] {
  // Standalone experience bookings have no stay to lay a timeline over.
  if (!stay) {
    return experiences.map((e) => ({
      date: toDateKey(e.date),
      kind: "experience" as const,
      label: e.name,
      href: e.href,
    }));
  }

  const byDate = new Map<string, TripExperience[]>();
  for (const e of experiences) {
    const key = toDateKey(e.date);
    byDate.set(key, [...(byDate.get(key) ?? []), e]);
  }

  const entries: TripTimelineEntry[] = [];
  const totalDays = Math.max(1, nightsBetween(stay.checkIn, stay.checkOut));

  for (let i = 0; i <= totalDays; i++) {
    const date = addDays(stay.checkIn, i);
    const isFirst = i === 0;
    const isLast = i === totalDays;
    const onThisDay = byDate.get(date) ?? [];

    if (isFirst) {
      entries.push({
        date,
        kind: "arrival",
        label: "Arrival",
        detail: `Check in at ${stay.propertyName}`,
      });
    }

    for (const e of onThisDay) {
      entries.push({
        date,
        kind: "experience",
        label: e.name,
        detail: `${e.guestsCount} ${e.guestsCount === 1 ? "guest" : "guests"}`,
        href: e.href,
      });
    }

    if (isLast) {
      entries.push({
        date,
        kind: "checkout",
        label: "Checkout",
        detail: `Check out of ${stay.propertyName}`,
      });
    } else if (!isFirst && onThisDay.length === 0) {
      entries.push({ date, kind: "free", label: "Free day" });
    }
  }

  return entries;
}

/* ─────────────────────────── assembly ─────────────────────────── */

function toStay(row: BookingLike, resolvers: TripResolvers): TripStay | null {
  if (!row.propertyId || !row.checkIn || !row.checkOut) return null;
  const info = resolvers.property(row.propertyId);
  const checkIn = toDateKey(row.checkIn);
  const checkOut = toDateKey(row.checkOut);
  return {
    bookingId: row.id,
    bookingNumber: row.bookingNumber,
    propertySlug: row.propertyId,
    // A delisted property must not blank the trip out — fall back to the slug.
    propertyName: info?.name ?? row.propertyId,
    propertyHref: info?.href ?? null,
    image: info?.image ?? null,
    city: info?.city ?? null,
    state: info?.state ?? null,
    locationNote: info?.locationNote ?? null,
    checkIn,
    checkOut,
    nights: nightsBetween(checkIn, checkOut),
    guestsCount: row.guestsCount,
    unitsCount: row.unitsCount,
    bookingStatus: row.bookingStatus,
    paymentStatus: row.paymentStatus,
    hostId: row.hostId,
  };
}

function toExperience(
  row: BookingLike,
  resolvers: TripResolvers,
): TripExperience | null {
  if (!row.experienceId || !row.experienceDate) return null;
  const info = resolvers.experience(row.experienceId);
  const date =
    typeof row.experienceDate === "string"
      ? row.experienceDate
      : row.experienceDate.toISOString();
  return {
    bookingId: row.id,
    bookingNumber: row.bookingNumber,
    slug: row.experienceId,
    name: info?.name ?? row.experienceId,
    href: info?.href ?? null,
    image: info?.image ?? null,
    date,
    guestsCount: row.guestsCount,
    bookingStatus: row.bookingStatus,
  };
}

/**
 * Groups booking rows into trips.
 *
 * A trip is anchored on a property stay; experience bookings whose date falls
 * inside that stay's window are attached to it. Experiences that match no stay
 * become their own single-item trips, so nothing a guest paid for disappears.
 */
export function buildTrips(
  rows: BookingLike[],
  resolvers: TripResolvers,
  todayKey: string,
): TripBuckets {
  const stayRows = rows.filter((r) => r.kind === "property");
  const experienceRows = rows.filter((r) => r.kind === "experience");

  const stays = stayRows
    .map((r) => ({ row: r, stay: toStay(r, resolvers) }))
    .filter((s): s is { row: BookingLike; stay: TripStay } => s.stay !== null);

  const experiences = experienceRows
    .map((r) => ({ row: r, exp: toExperience(r, resolvers) }))
    .filter((e): e is { row: BookingLike; exp: TripExperience } => e.exp !== null);

  const claimed = new Set<string>();
  const trips: Trip[] = [];

  for (const { row, stay } of stays) {
    const mine = experiences.filter(({ exp }) => {
      if (claimed.has(exp.bookingId)) return false;
      const key = toDateKey(exp.date);
      // Inclusive of both check-in and checkout day.
      return key >= stay.checkIn && key <= stay.checkOut;
    });
    for (const { exp } of mine) claimed.add(exp.bookingId);

    const attached = mine
      .map(({ exp }) => exp)
      .sort((a, b) => a.date.localeCompare(b.date));

    trips.push({
      id: row.id,
      title: stay.city ?? stay.state ?? stay.propertyName,
      subtitle: stay.propertyName,
      status: classifyTrip(row.bookingStatus, stay.checkIn, stay.checkOut, todayKey),
      start: stay.checkIn,
      end: stay.checkOut,
      stay,
      experiences: attached,
      timeline: buildTimeline(stay, attached),
    });
  }

  // Experience bookings with no surrounding stay stand on their own.
  for (const { row, exp } of experiences) {
    if (claimed.has(exp.bookingId)) continue;
    const key = toDateKey(exp.date);
    trips.push({
      id: row.id,
      title: exp.name,
      subtitle: null,
      status: classifyTrip(row.bookingStatus, key, key, todayKey),
      start: key,
      end: key,
      stay: null,
      experiences: [exp],
      timeline: buildTimeline(null, [exp]),
    });
  }

  const upcoming = trips
    .filter((t) => t.status === "upcoming" || t.status === "in_progress")
    .sort((a, b) => a.start.localeCompare(b.start));
  const past = trips
    .filter((t) => t.status === "past")
    .sort((a, b) => b.start.localeCompare(a.start));
  const cancelled = trips
    .filter((t) => t.status === "cancelled")
    .sort((a, b) => b.start.localeCompare(a.start));

  return { upcoming, past, cancelled };
}
