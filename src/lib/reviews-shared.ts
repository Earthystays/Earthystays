/**
 * Client-safe review types + pure helpers. NO fs/storage imports here —
 * client components import from this module; the fs-backed data layer
 * (src/lib/data/reviews.ts) re-exports it for server callers.
 */

export type GuestType = "Family" | "Couple" | "Friends" | "Corporate" | "Solo";

export type ReviewSource = "direct" | "google" | "airbnb" | "booking";

export type ReviewStatus = "pending" | "approved" | "rejected" | "spam";

export const REVIEW_CATEGORIES = [
  "cleanliness",
  "location",
  "accuracy",
  "communication",
  "checkin",
  "value",
] as const;
export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];
export type CategoryRatings = Partial<Record<ReviewCategory, number>>;

export const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  cleanliness: "Cleanliness",
  location: "Location",
  accuracy: "Accuracy",
  communication: "Communication",
  checkin: "Check-in",
  value: "Value",
};

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
  /** Linked experience slug — set when the review is for a marketplace
   *  experience rather than a villa. Mutually exclusive with villaSlug. */
  experienceSlug?: string;
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

  /* --- Guest-submitted review fields (2026-07 review system) --- */
  /** Moderation state. Absent = approved (legacy team-curated records). */
  status?: ReviewStatus;
  /** Account that submitted the review (guest submissions only). */
  userId?: string;
  /** Contact email captured at submission (not shown publicly). */
  email?: string;
  /** Guest country, e.g. "India". Optional. */
  country?: string;
  /** Per-category star ratings, each 1–5. */
  categoryRatings?: CategoryRatings;
  /** Photo URLs uploaded with the review (/uploads/reviews/...). */
  photos?: string[];
  /** "Helpful" vote count. */
  helpfulCount?: number;
  /** Times guests flagged this review — surfaces in admin, never auto-hides. */
  reportCount?: number;
  /** Public reply from the Earthy Stays team / host. */
  reply?: { text: string; by: "team" | "host"; at: string };
  updatedAt?: string;
  /** Phase 2: set when the review is tied to a completed booking. */
  bookingId?: string;
};

/** Aggregate for the listing-page header: overall + per-category averages. */
export type ReviewSummary = {
  count: number;
  average: number;
  categories: { key: ReviewCategory; label: string; average: number }[];
};

export function getAverageRating(reviews: StoredReview[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function computeReviewSummary(reviews: StoredReview[]): ReviewSummary {
  const categories = REVIEW_CATEGORIES.map((key) => {
    const rated = reviews
      .map((r) => r.categoryRatings?.[key])
      .filter((n): n is number => typeof n === "number" && n >= 1);
    const average =
      rated.length === 0
        ? 0
        : Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10;
    return { key, label: CATEGORY_LABELS[key], average };
  }).filter((c) => c.average > 0);
  return { count: reviews.length, average: getAverageRating(reviews), categories };
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
