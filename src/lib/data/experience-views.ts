import { readJson, writeJson, readJsonSync } from "@/lib/storage";

const FILE = "experience-views.json";
const KEEP_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const RECENT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Experience slug → array of view timestamps (epoch ms). Mirrors the
 *  villa-views store so the admin can show a light popularity number. */
export type ViewStore = Record<string, number[]>;

export async function recordExperienceView(slug: string): Promise<void> {
  if (!slug) return;
  const store = await readJson<ViewStore>(FILE, {});
  const now = Date.now();
  const events = (store[slug] ?? []).filter((t) => now - t < KEEP_MS);
  events.push(now);
  store[slug] = events;
  await writeJson(FILE, store);
}

/** Raw view count per experience within the last 30 days (or a range). */
export function getExperienceViewCountsSync(range?: {
  start: number;
  end: number;
}): Record<string, number> {
  const store = readJsonSync<ViewStore>(FILE, {});
  const now = Date.now();
  const start = range?.start ?? now - RECENT_MS;
  const end = range?.end ?? now;
  const counts: Record<string, number> = {};
  for (const [slug, events] of Object.entries(store)) {
    counts[slug] = events.filter((t) => t >= start && t <= end).length;
  }
  return counts;
}

/** Weighted score for popularity sort — recent views count double. */
export function getExperienceViewScoresSync(): Record<string, number> {
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
