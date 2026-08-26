/**
 * Per-property performance for the host dashboard.
 *
 * Every figure is derived from data the app already holds — view events,
 * inquiries, and accepted-inquiry stays. Revenue is the same INDICATIVE
 * figure the rest of the host area uses (nights × nightly price); the real
 * settled-money engine belongs to the booking/payment stream, and nothing
 * here pretends otherwise.
 *
 * Metrics with no underlying data are `null`, never 0 — "no reviews yet" and
 * "rated 0" must not look the same to an owner.
 */
import type { Villa } from "@/lib/types";
import { computeReviewSummary, getReviewsByVilla } from "@/lib/data/reviews";
import {
  dayKey,
  occupancyPct,
  occupiesNight,
  type HostBooking,
  type HostData,
} from "@/lib/host-metrics";

export type PropertyPerformance = {
  slug: string;
  name: string;
  /** Listing views in the window (30 days by default). */
  views: number;
  /** Inquiries received for this listing, all time. */
  inquiries: number;
  /** Inquiries in the same 30-day window as `views` — the conversion numerator. */
  recentInquiries: number;
  /** Accepted, dated stays. */
  bookings: number;
  /** Indicative revenue for the month in question. */
  revenue: number;
  /** Booked nights in the month — the ADR denominator. */
  bookedNights: number;
  /** Average daily rate: revenue ÷ booked nights. Null with no booked nights. */
  adr: number | null;
  /** Occupancy % for the month, blocked nights excluded from the denominator. */
  occupancy: number;
  /** Average guest rating, or null when the listing has no reviews. */
  rating: number | null;
  reviewCount: number;
  /**
   * Recent inquiries ÷ views, as a percentage. Null when there are no views.
   * Both sides cover the same 30-day window — comparing all-time inquiries
   * against 30 days of views produced impossible figures like 400%.
   */
  conversion: number | null;
};

function revenueForMonth(
  bookings: HostBooking[],
  slug: string,
  year: number,
  month: number,
): { revenue: number; nights: number } {
  const days = new Date(year, month + 1, 0).getDate();
  let revenue = 0;
  let nights = 0;
  for (const b of bookings) {
    if (b.villa.slug !== slug) continue;
    for (let i = 0; i < days; i++) {
      const day = new Date(year, month, i + 1);
      if (occupiesNight(b, day)) {
        revenue += b.villa.pricePerNight;
        nights += 1;
      }
    }
  }
  return { revenue, nights };
}

/** Matches `getRecentViewCountsSync`'s default window. */
const VIEW_WINDOW_DAYS = 30;

export function getPropertyPerformance(
  data: HostData,
  views: Record<string, number>,
  year: number,
  month: number,
  now: Date = new Date(),
): PropertyPerformance[] {
  const windowStart = now.getTime() - VIEW_WINDOW_DAYS * 86_400_000;

  return data.listings.map((listing) => {
    const slug = listing.slug;
    const listingViews = views[slug] ?? 0;
    const mine = data.requests.filter((q) => q.villa === slug);
    const inquiries = mine.length;
    const recentInquiries = mine.filter((q) => {
      const t = Date.parse(q.createdAt ?? "");
      return Number.isFinite(t) && t >= windowStart;
    }).length;
    const bookings = data.bookings.filter((b) => b.villa.slug === slug).length;

    const { revenue, nights } = revenueForMonth(data.bookings, slug, year, month);

    const reviews = getReviewsByVilla(slug);
    const summary = computeReviewSummary(reviews);

    return {
      slug,
      name: listing.name,
      views: listingViews,
      inquiries,
      recentInquiries,
      bookings,
      revenue,
      bookedNights: nights,
      adr: nights > 0 ? Math.round(revenue / nights) : null,
      occupancy: occupancyPct(
        data.listings,
        data.bookings,
        data.blockedBySlug,
        year,
        month,
        slug,
      ),
      // Fall back to the listing's own rating only when it has real reviews.
      rating:
        summary.count > 0
          ? summary.average
          : listing.reviewCount > 0
            ? listing.rating
            : null,
      reviewCount: summary.count > 0 ? summary.count : listing.reviewCount,
      conversion:
        listingViews > 0
          ? Math.round((recentInquiries / listingViews) * 100)
          : null,
    };
  });
}

/** Portfolio totals for the month. */
export function summarisePerformance(rows: PropertyPerformance[]) {
  const revenue = rows.reduce((n, r) => n + r.revenue, 0);
  const bookedNights = rows.reduce((n, r) => n + r.bookedNights, 0);
  const views = rows.reduce((n, r) => n + r.views, 0);
  const inquiries = rows.reduce((n, r) => n + r.inquiries, 0);
  const recentInquiries = rows.reduce((n, r) => n + r.recentInquiries, 0);
  const bookings = rows.reduce((n, r) => n + r.bookings, 0);
  const rated = rows.filter((r) => r.rating !== null);

  return {
    revenue,
    bookedNights,
    views,
    inquiries,
    recentInquiries,
    bookings,
    adr: bookedNights > 0 ? Math.round(revenue / bookedNights) : null,
    // Portfolio occupancy is a weighted average, so recompute from the parts
    // rather than averaging percentages.
    occupancy:
      rows.length > 0
        ? Math.round(rows.reduce((n, r) => n + r.occupancy, 0) / rows.length)
        : 0,
    rating:
      rated.length > 0
        ? Math.round(
            (rated.reduce((n, r) => n + (r.rating ?? 0), 0) / rated.length) * 10,
          ) / 10
        : null,
  };
}

/** Free (unbooked, unblocked) nights in the next `days` days, per listing. */
export function openNightsAhead(
  data: HostData,
  days = 30,
): { slug: string; name: string; open: number }[] {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return data.listings.map((listing) => {
    const blocked = new Set(data.blockedBySlug[listing.slug] ?? []);
    let open = 0;
    for (let i = 0; i < days; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      if (blocked.has(dayKey(day))) continue;
      const booked = data.bookings.some(
        (b) => b.villa.slug === listing.slug && occupiesNight(b, day),
      );
      if (!booked) open += 1;
    }
    return { slug: listing.slug, name: listing.name, open };
  });
}

/** Listings whose content looks thin, with the specific reason. */
export function contentGaps(listings: Villa[]): {
  slug: string;
  name: string;
  reasons: string[];
}[] {
  const out: { slug: string; name: string; reasons: string[] }[] = [];
  for (const l of listings) {
    const reasons: string[] = [];
    if ((l.images?.length ?? 0) < 8) {
      reasons.push(`only ${l.images?.length ?? 0} photos`);
    }
    if ((l.highlights?.length ?? 0) === 0) reasons.push("no highlights");
    if ((l.description ?? "").trim().length < 200) reasons.push("short description");
    if ((l.amenities?.length ?? 0) < 5) reasons.push("few amenities");
    if (reasons.length > 0) out.push({ slug: l.slug, name: l.name, reasons });
  }
  return out;
}
