/**
 * View types for My Trips.
 *
 * These describe a *presentation* shape assembled at read time from booking
 * rows the booking/payment stream owns. Nothing here is persisted — there is
 * no trips table and no parallel booking store.
 */

export type TripStatus = "upcoming" | "in_progress" | "past" | "cancelled";

/** The stay half of a trip, resolved against the property catalog. */
export type TripStay = {
  bookingId: string;
  bookingNumber: string;
  propertySlug: string;
  /** Falls back to the slug when the property is no longer in the catalog. */
  propertyName: string;
  propertyHref: string | null;
  image: { src: string; alt: string } | null;
  city: string | null;
  state: string | null;
  /** Free-text location note — the closest thing to an address we hold. */
  locationNote: string | null;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  guestsCount: number;
  unitsCount: number;
  bookingStatus: string;
  paymentStatus: string;
  hostId: string;
};

/** An experience booked within (or alongside) a trip. */
export type TripExperience = {
  bookingId: string;
  bookingNumber: string;
  slug: string;
  name: string;
  href: string | null;
  image: { src: string; alt: string } | null;
  /** ISO datetime of the experience. */
  date: string;
  guestsCount: number;
  bookingStatus: string;
};

export type TripTimelineEntry = {
  /** YYYY-MM-DD */
  date: string;
  kind: "arrival" | "experience" | "free" | "checkout";
  label: string;
  detail?: string;
  href?: string | null;
};

export type Trip = {
  /** The anchoring booking's id — stable, and what /trips/[id] resolves. */
  id: string;
  /** Destination headline, e.g. "Goa". */
  title: string;
  subtitle: string | null;
  status: TripStatus;
  /** Trip span, YYYY-MM-DD. */
  start: string;
  end: string;
  stay: TripStay | null;
  experiences: TripExperience[];
  timeline: TripTimelineEntry[];
};

export type TripBuckets = {
  upcoming: Trip[];
  past: Trip[];
  cancelled: Trip[];
};

/**
 * Why the trips list is empty. Lets the UI distinguish "you have no trips"
 * from "we can't reach the booking system right now" — the two need very
 * different copy, and guessing wrong is worse than saying nothing.
 */
export type TripsAvailability = "ok" | "unavailable";

export type TripsResult = TripBuckets & { availability: TripsAvailability };
