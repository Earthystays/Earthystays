import { readJsonSync } from "@/lib/storage";

export type StoredReview = {
  id: string;
  guestName: string; // "Aanya & Rohit" or "The Mehta family"
  villaName?: string; // optional context — "Casa Azul"
  location?: string; // optional context — "Goa" / "Lonavala"
  quote: string;
  rating: number; // 1–5
  createdAt: string;
};

const FILE = "reviews.json";

// Fallback seed used when no admin reviews have been added yet — keeps the
// home page from looking empty for brand-new installs.
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
  // If admin has added any, use those; otherwise fall back to the seed.
  return stored.length > 0 ? stored : SEED;
}

/** Admin-only: returns ONLY persisted reviews (no seed fallback) so admin
 *  doesn't see and try to "delete" placeholders that aren't in storage. */
export function getStoredReviews(): StoredReview[] {
  return readJsonSync<StoredReview[]>(FILE, []);
}
