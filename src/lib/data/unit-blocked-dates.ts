import { readJson, writeJson } from "@/lib/storage";

/**
 * Per-unit blocked dates (Phase H) — mirrors the property-level
 * blocked-dates.ts, but keyed per accommodation unit so an operator can mark
 * one room type / dorm unavailable for specific nights without blocking the
 * whole property. A blocked date means the night starting on that date is
 * unavailable for that unit. Dates are "YYYY-MM-DD".
 */
type UnitBlockedStore = Record<string, string[]>; // key: `${slug}::${unitId}`

const FILE = "unit-blocked-dates.json";
const key = (slug: string, unitId: string) => `${slug}::${unitId}`;

export async function getUnitBlockedDates(
  slug: string,
  unitId: string,
): Promise<string[]> {
  const store = await readJson<UnitBlockedStore>(FILE, {});
  return store[key(slug, unitId)] ?? [];
}

/** Blocked dates for every unit on a property → { [unitId]: dates }. */
export async function getBlockedDatesForProperty(
  slug: string,
): Promise<Record<string, string[]>> {
  const store = await readJson<UnitBlockedStore>(FILE, {});
  const prefix = `${slug}::`;
  const out: Record<string, string[]> = {};
  for (const [k, dates] of Object.entries(store)) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = dates;
  }
  return out;
}

export async function toggleUnitBlockedDate(
  slug: string,
  unitId: string,
  date: string,
): Promise<{ blocked: boolean; dates: string[] }> {
  const store = await readJson<UnitBlockedStore>(FILE, {});
  const k = key(slug, unitId);
  const set = new Set(store[k] ?? []);
  let blocked: boolean;
  if (set.has(date)) {
    set.delete(date);
    blocked = false;
  } else {
    set.add(date);
    blocked = true;
  }
  store[k] = Array.from(set).sort();
  await writeJson(FILE, store);
  return { blocked, dates: store[k] };
}

/** Drop every stored block for a unit (used when the unit is deleted). */
export async function clearUnitBlockedDates(
  slug: string,
  unitId: string,
): Promise<void> {
  const store = await readJson<UnitBlockedStore>(FILE, {});
  const k = key(slug, unitId);
  if (store[k]) {
    delete store[k];
    await writeJson(FILE, store);
  }
}
