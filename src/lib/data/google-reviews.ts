import { readJsonSync, writeJson } from "@/lib/storage";
import type { StoredReview } from "@/lib/reviews-shared";

/**
 * Google review import via the Places API (New). Env-gated like every other
 * integration: without GOOGLE_PLACES_API_KEY nothing fetches and villa pages
 * simply show no Google reviews. Google returns at most ~5 "most relevant"
 * reviews per place — that's an API limit, not ours.
 *
 * Cache: data/google-reviews.json, keyed by placeId, refreshed at most once
 * per REFRESH_MS on villa-page load (stale-while-revalidate style: readers
 * always get the cache; a stale cache triggers a background refetch).
 */

const FILE = "google-reviews.json";
// 72h: keeps even 100 villas comfortably inside Google's free monthly tier.
const REFRESH_MS = 72 * 60 * 60 * 1000;

export type GooglePlaceCache = {
  fetchedAt: string;
  rating?: number;
  count?: number;
  reviews: {
    author: string;
    authorPhoto?: string;
    rating: number;
    text: string;
    publishedAt: string;
  }[];
};

type CacheFile = Record<string, GooglePlaceCache>;

function readCache(): CacheFile {
  return readJsonSync<CacheFile>(FILE, {});
}

/** Cached Google reviews for a place — never triggers a network call. */
export function getGoogleReviews(placeId: string): GooglePlaceCache | undefined {
  return readCache()[placeId];
}

/** In-flight refreshes, so concurrent page loads don't stampede the API. */
const inFlight = new Set<string>();

/**
 * Fire-and-forget refresh — call from the villa page; returns immediately.
 * The NEXT page view sees the fresh data (same contract as iCal sync).
 */
export function refreshGoogleReviewsIfStale(placeId: string): void {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !placeId || inFlight.has(placeId)) return;
  const cached = readCache()[placeId];
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < REFRESH_MS) return;

  inFlight.add(placeId);
  void (async () => {
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        {
          headers: {
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "rating,userRatingCount,reviews",
          },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!res.ok) {
        console.error("[google-reviews] fetch failed", placeId, res.status);
        return;
      }
      const data = (await res.json()) as {
        rating?: number;
        userRatingCount?: number;
        reviews?: Array<{
          rating?: number;
          text?: { text?: string };
          originalText?: { text?: string };
          authorAttribution?: { displayName?: string; photoUri?: string };
          publishTime?: string;
        }>;
      };
      const entry: GooglePlaceCache = {
        fetchedAt: new Date().toISOString(),
        rating: data.rating,
        count: data.userRatingCount,
        reviews: (data.reviews ?? [])
          .filter((r) => typeof r.rating === "number")
          .map((r) => ({
            author: r.authorAttribution?.displayName ?? "Google user",
            authorPhoto: r.authorAttribution?.photoUri,
            rating: r.rating!,
            text: r.text?.text ?? r.originalText?.text ?? "",
            publishedAt: r.publishTime ?? new Date().toISOString(),
          })),
      };
      const cache = readCache();
      cache[placeId] = entry;
      await writeJson(FILE, cache);
    } catch (err) {
      console.error("[google-reviews] refresh failed", placeId, err);
    } finally {
      inFlight.delete(placeId);
    }
  })();
}

/**
 * Cached Google reviews shaped as StoredReview pseudo-records so the villa
 * page renders them in the same list. IDs are prefixed "gplace_" — the UI
 * hides Helpful/Report for these (they don't exist in reviews.json).
 */
export function getGoogleReviewsAsStored(placeId: string): StoredReview[] {
  const cached = getGoogleReviews(placeId);
  if (!cached) return [];
  return cached.reviews
    .filter((r) => r.text.trim().length > 0)
    .map((r, i) => ({
      id: `gplace_${placeId}_${i}`,
      guestName: r.author,
      guestPhoto: r.authorPhoto,
      quote: r.text,
      rating: r.rating,
      source: "google" as const,
      createdAt: r.publishedAt,
    }));
}
