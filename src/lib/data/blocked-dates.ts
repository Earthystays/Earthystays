import { readJson, writeJson } from "@/lib/storage";

/** Per-listing blocked dates, stored as "YYYY-MM-DD" strings.
 *  A blocked date means the night starting on that date is unavailable. */
type BlockedStore = Record<string, string[]>;

const FILE = "blocked-dates.json";

export async function getBlockedDates(slug: string): Promise<string[]> {
  const store = await readJson<BlockedStore>(FILE, {});
  return store[slug] ?? [];
}

export async function toggleBlockedDate(
  slug: string,
  date: string,
): Promise<{ blocked: boolean; dates: string[] }> {
  const store = await readJson<BlockedStore>(FILE, {});
  const set = new Set(store[slug] ?? []);
  let blocked: boolean;
  if (set.has(date)) {
    set.delete(date);
    blocked = false;
  } else {
    set.add(date);
    blocked = true;
  }
  store[slug] = Array.from(set).sort();
  await writeJson(FILE, store);
  return { blocked, dates: store[slug] };
}
