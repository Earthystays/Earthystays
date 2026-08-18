import { randomBytes } from "crypto";
import { readJsonSync, writeJson } from "@/lib/storage";
import type {
  CategoryRatings,
  ReviewStatus,
  StoredReview,
} from "@/lib/reviews-shared";

// Types + pure helpers live in the client-safe module — re-export so the
// many existing server-side imports keep working. Client components must
// import from "@/lib/reviews-shared" directly (this module pulls in fs).
export * from "@/lib/reviews-shared";

/**
 * Phase 1: any signed-in user may review, no booking required.
 * Phase 2: flip this to true — submitReview will then demand a bookingId
 * and the UI should gate the Write-a-Review button the same way.
 */
export const REQUIRE_COMPLETED_BOOKING = false;

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

/** True when a review may appear on public surfaces: not hidden by the
 *  team, and either legacy (no status) or moderation-approved. */
export function isPublicReview(r: StoredReview): boolean {
  return r.active !== false && (!r.status || r.status === "approved");
}

/** Reviews that should appear on public surfaces. Treats unset `active`
 *  as true for backward compatibility. */
export function getActiveReviews(): StoredReview[] {
  return getReviews().filter(isPublicReview);
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

export function getReviewsByExperience(slug: string): StoredReview[] {
  return getActiveReviews().filter((r) => r.experienceSlug === slug);
}

/* ------------------------------------------------------------------ */
/* Guest-submitted reviews — mutations & queue accessors               */
/* ------------------------------------------------------------------ */

async function mutateReviews(
  fn: (list: StoredReview[]) => StoredReview[] | void,
): Promise<StoredReview[]> {
  // Persisted list only — the SEED fallback must never be written back.
  const list = readJsonSync<StoredReview[]>(FILE, []);
  const next = fn(list) ?? list;
  await writeJson(FILE, next);
  return next;
}

export type SubmitReviewInput = {
  /** Either villaSlug or experienceSlug is set, depending on the target. */
  villaSlug?: string;
  experienceSlug?: string;
  userId: string;
  guestName: string;
  email: string;
  country?: string;
  stayMonth?: string;
  rating: number;
  title?: string;
  quote: string;
  categoryRatings?: CategoryRatings;
  photos?: string[];
  bookingId?: string;
};

/** Guest submission — always lands in the moderation queue. */
export async function submitReview(input: SubmitReviewInput): Promise<StoredReview> {
  const review: StoredReview = {
    id: `rev_${Date.now()}_${randomBytes(4).toString("hex")}`,
    guestName: input.guestName,
    villaSlug: input.villaSlug,
    experienceSlug: input.experienceSlug,
    stayMonth: input.stayMonth || undefined,
    title: input.title?.trim() || undefined,
    quote: input.quote.trim(),
    rating: input.rating,
    source: "direct",
    createdAt: new Date().toISOString(),
    status: "pending",
    userId: input.userId,
    email: input.email,
    country: input.country?.trim() || undefined,
    categoryRatings: input.categoryRatings,
    photos: input.photos && input.photos.length > 0 ? input.photos : undefined,
    helpfulCount: 0,
    bookingId: input.bookingId,
  };
  await mutateReviews((list) => {
    list.push(review);
  });
  return review;
}

export async function incrementHelpful(id: string): Promise<number> {
  let count = 0;
  await mutateReviews((list) => {
    const r = list.find((x) => x.id === id);
    if (!r) throw new Error("Review not found");
    r.helpfulCount = (r.helpfulCount ?? 0) + 1;
    count = r.helpfulCount;
  });
  return count;
}

export async function reportReview(id: string): Promise<void> {
  await mutateReviews((list) => {
    const r = list.find((x) => x.id === id);
    if (!r) throw new Error("Review not found");
    r.reportCount = (r.reportCount ?? 0) + 1;
  });
}

/** Admin queue accessor — guest submissions grouped by moderation state. */
export function getReviewsByStatus(status: ReviewStatus): StoredReview[] {
  const stored = getStoredReviews();
  if (status === "approved") {
    return stored.filter((r) => !r.status || r.status === "approved");
  }
  return stored.filter((r) => r.status === status);
}
