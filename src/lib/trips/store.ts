/**
 * Read-only access to the guest's bookings.
 *
 * IMPORTANT: this module only ever SELECTs. Bookings, payments, availability
 * and cancellation are owned by the booking/payment stream — My Trips is a
 * presentation layer over the rows that stream writes, never a second store.
 *
 * The booking tables live in PostgreSQL while the rest of the app is still
 * JSON-backed, so every call here is defensive: with no DATABASE_URL (or an
 * unreachable database) it reports `unavailable` instead of throwing, and the
 * UI shows a calm message rather than an error page.
 */
import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookings } from "@/db/schema/bookings";
import { getVillaBySlug } from "@/lib/data/villas";
import { experienceHref, getExperienceBySlug } from "@/lib/data/experiences";
import { propertyPath } from "@/lib/property-url";
import { buildTrips, toDateKey, type BookingLike, type TripResolvers } from "./build";
import type { Trip, TripsResult } from "./types";

/** Resolves booking slugs against the live JSON catalog. */
const resolvers: TripResolvers = {
  property(slug) {
    const villa = getVillaBySlug(slug);
    if (!villa) return null;
    const cover = villa.images?.[0];
    return {
      name: villa.name,
      href: propertyPath(villa),
      image: cover ? { src: cover.src, alt: cover.alt || villa.name } : null,
      city: villa.city ?? null,
      state: villa.state ?? null,
      locationNote: villa.locationNote ?? null,
    };
  },
  experience(slug) {
    const exp = getExperienceBySlug(slug);
    if (!exp) return null;
    return {
      name: exp.name,
      href: experienceHref(exp),
      image: exp.image?.src
        ? { src: exp.image.src, alt: exp.image.alt || exp.name }
        : null,
    };
  },
};

const EMPTY: TripsResult = {
  upcoming: [],
  past: [],
  cancelled: [],
  availability: "unavailable",
};

/** True when a booking database is even configured. */
function bookingStoreConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

async function loadRows(guestId: string): Promise<BookingLike[] | null> {
  if (!bookingStoreConfigured()) return null;
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: bookings.id,
        bookingNumber: bookings.bookingNumber,
        kind: bookings.kind,
        guestId: bookings.guestId,
        hostId: bookings.hostId,
        propertyId: bookings.propertyId,
        experienceId: bookings.experienceId,
        checkIn: bookings.checkIn,
        checkOut: bookings.checkOut,
        experienceDate: bookings.experienceDate,
        guestsCount: bookings.guestsCount,
        unitsCount: bookings.unitsCount,
        bookingStatus: bookings.bookingStatus,
        paymentStatus: bookings.paymentStatus,
      })
      .from(bookings)
      // Scoped to the signed-in guest at the query level — a guest can never
      // see another guest's booking, whatever id is passed in the URL.
      .where(eq(bookings.guestId, guestId))
      .orderBy(desc(bookings.createdAt));

    return rows as BookingLike[];
  } catch (err) {
    // Unreachable database, missing migration, etc. Never surface to the guest.
    console.error("[trips] could not read bookings:", err);
    return null;
  }
}

/** All of a guest's trips, bucketed. Never throws. */
export async function getTripsForUser(guestId: string): Promise<TripsResult> {
  const rows = await loadRows(guestId);
  if (rows === null) return EMPTY;

  const today = toDateKey(new Date());
  const buckets = buildTrips(rows, resolvers, today);
  return { ...buckets, availability: "ok" };
}

/**
 * One trip by its anchoring booking id, scoped to the owner.
 *
 * Returns null both when the trip does not exist and when it belongs to
 * someone else — the caller renders the same 404 either way, so the route
 * cannot be used to probe for other people's bookings.
 */
export async function getTripForUser(
  guestId: string,
  tripId: string,
): Promise<Trip | null> {
  const rows = await loadRows(guestId);
  if (rows === null) return null;

  const today = toDateKey(new Date());
  const { upcoming, past, cancelled } = buildTrips(rows, resolvers, today);
  return (
    [...upcoming, ...past, ...cancelled].find((t) => t.id === tripId) ?? null
  );
}

/** Exported for the empty-state copy; avoids a second DB round trip. */
export function isBookingStoreConfigured(): boolean {
  return bookingStoreConfigured();
}
