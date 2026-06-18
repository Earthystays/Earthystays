import { readJson, writeJson, readJsonSync } from "@/lib/storage";

const FILE = "villa-views.json";
const KEEP_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const RECENT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Slug → array of view timestamps (epoch ms). Events older than 60 days
 *  are pruned on write to keep the file from growing unbounded. */
export type ViewStore = Record<string, number[]>;

export async function recordView(slug: string): Promise<void> {
  if (!slug) return;
  const store = await readJson<ViewStore>(FILE, {});
  const now = Date.now();
  const events = (store[slug] ?? []).filter((t) => now - t < KEEP_MS);
  events.push(now);
  store[slug] = events;
  await writeJson(FILE, store);
}

/** Weighted view score for ranking. Views in the last 30 days count
 *  double, older views (still within the 60-day window) count single.
 *  A villa with no views returns 0 — sorts last among unviewed ties. */
export function getViewScoresSync(): Record<string, number> {
  const store = readJsonSync<ViewStore>(FILE, {});
  const now = Date.now();
  const scores: Record<string, number> = {};
  for (const [slug, events] of Object.entries(store)) {
    let score = 0;
    for (const t of events) {
      const age = now - t;
      if (age > KEEP_MS) continue;
      score += age < RECENT_MS ? 2 : 1;
    }
    scores[slug] = score;
  }
  return scores;
}

/** Raw count of views in the last 30 days — for the admin "most viewed
 *  this month" widget. */
export function getRecentViewCountsSync(): Record<string, number> {
  const store = readJsonSync<ViewStore>(FILE, {});
  const now = Date.now();
  const counts: Record<string, number> = {};
  for (const [slug, events] of Object.entries(store)) {
    counts[slug] = events.filter((t) => now - t < RECENT_MS).length;
  }
  return counts;
}
