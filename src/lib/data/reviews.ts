import { readJsonSync } from "@/lib/storage";

export type GuestType =
  | "Family"
  | "Couple"
  | "Friends"
  | "Corporate"
  | "Solo";

export type ReviewSource = "direct" | "google" | "airbnb" | "booking";

export type StoredReview = {
  id: string;
  guestName: string;
  /** URL of the guest photo (typically /uploads/...). Empty/missing
   *  falls back to initials avatar. */
  guestPhoto?: string;
  /** Guest hometown, e.g. "Mumbai, Maharashtra". Optional. */
  guestLocation?: string;
  /** Linked villa slug — when set, villaName + location are derived from
   *  the property record. Free-text villaName/location below remain as
   *  legacy fields for reviews predating the link. */
  villaSlug?: string;
  villaName?: string;
  location?: string;
  /** "YYYY-MM" — rendered as "May 2026" via formatStayMonth. */
  stayMonth?: string;
  /** Optional short headline shown above the quote. */
  title?: string;
  quote: string;
  rating: number; // 1–5
  guestType?: GuestType;
  /** Featured reviews appear on the home page. */
  featured?: boolean;
  /** Some guests opt out of showing their photo even if uploaded. */
  showPhoto?: boolean;
  /** Defaults to true. False hides the review from public surfaces but
   *  keeps it in admin so the team can re-enable later. */
  active?: boolean;
  /** Where the review originated. "direct" by default. */
  source?: ReviewSource;
  createdAt: string;
};

const FILE = "reviews.json";

const SEED: StoredReview[] = [
  {
    id: "seed_1",
    guestName: "Aanya & Rohit",
    villaName: "Casa Azul",
    location: "Goa",
    quote:
      "The kind of place where you arrive a little frayed and leave with your shoulders down. The cook fed us like we'd grown up there.",
    rating: 5,
    createdAt: "2025-12-01T00:00:00.000Z",
  },
  {
    id: "seed_2",
    guestName: "The Mehta family",
    villaName: "Banyan House",
    location: "Lonavala",
    quote:
      "Booked it for a 40th. The team had birthday flowers waiting, the bonfire lit, and a custom dessert menu. Worth every rupee.",
    rating: 5,
    createdAt: "2025-12-02T00:00:00.000Z",
  },
  {
    id: "seed_3",
    guestName: "Priya S.",
    villaName: "Haveli Mor",
    location: "Udaipur",
    quote:
      "We stayed three nights and asked to extend twice. It's not a hotel — it's somebody's most loved house, lent to you.",
    rating: 5,
    createdAt: "2025-12-03T00:00:00.000Z",
  },
];

export function getReviews(): StoredReview[] {
  const stored = readJsonSync<StoredReview[]>(FILE, []);
  return stored.length > 0 ? stored : SEED;
}

/** Admin-only: returns ONLY persisted reviews (no seed fallback). */
export function getStoredReviews(): StoredReview[] {
  return readJsonSync<StoredReview[]>(FILE, []);
}

/** Reviews that should appear on public surfaces. Treats unset `active`
 *  as true for backward compatibility. */
export function getActiveReviews(): StoredReview[] {
  return getReviews().filter((r) => r.active !== false);
}

/** Reviews to show on the home page. If any are explicitly featured,
 *  use those; otherwise fall back to the highest-rated active reviews
 *  so the home page never goes empty. */
export function getFeaturedReviews(limit = 6): StoredReview[] {
  const active = getActiveReviews();
  const featured = active.filter((r) => r.featured === true);
  if (featured.length >= 3) return featured.slice(0, limit);
  return [...active]
    .sort(
      (a, b) =>
        b.rating - a.rating ||
        b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, limit);
}

export function getReviewsByVilla(slug: string): StoredReview[] {
  return getActiveReviews().filter((r) => r.villaSlug === slug);
}

export function getAverageRating(reviews: StoredReview[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function formatStayMonth(input?: string): string {
  if (!input) return "";
  const [y, m] = input.split("-");
  const year = Number(y);
  const month = Number(m);
  if (!year || !month || month < 1 || month > 12) return "";
  const monthName = new Date(year, month - 1, 1).toLocaleString(undefined, {
    month: "long",
  });
  return `${monthName} ${year}`;
}

export const GUEST_TYPES: readonly GuestType[] = [
  "Family",
  "Couple",
  "Friends",
  "Corporate",
  "Solo",
] as const;
