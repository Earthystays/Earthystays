import { readJson, writeJson } from "@/lib/storage";

/**
 * Per-unit, per-date rate & inventory overrides (calendar — Phase 21).
 *
 * Keyed `${slug}::${unitId}` → { "YYYY-MM-DD": { price?, units? } }. An override
 * is sparse: only dates the operator has customised are stored. A missing date
 * falls back to the unit's base/weekend price and pooled inventory (see
 * effectiveUnitPrice / effectiveUnitUnits in units.ts). Live data is gitignored.
 */
export type RateOverride = { price?: number; units?: number };
export type UnitDateMap = Record<string, RateOverride>;
type Store = Record<string, UnitDateMap>;

const FILE = "unit-rates.json";
const key = (slug: string, unitId: string) => `${slug}::${unitId}`;

export async function getUnitRates(
  slug: string,
  unitId: string,
): Promise<UnitDateMap> {
  const store = await readJson<Store>(FILE, {});
  return store[key(slug, unitId)] ?? {};
}

/** Overrides for every unit on a property → { [unitId]: { [date]: override } }. */
export async function getRatesForProperty(
  slug: string,
): Promise<Record<string, UnitDateMap>> {
  const store = await readJson<Store>(FILE, {});
  const prefix = `${slug}::`;
  const out: Record<string, UnitDateMap> = {};
  for (const [k, map] of Object.entries(store)) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = map;
  }
  return out;
}

/** Upsert one date's override. Passing an empty override (no price & no units)
 *  clears that date. */
export async function setUnitRate(
  slug: string,
  unitId: string,
  date: string,
  override: RateOverride,
): Promise<{ ok: true; dates: UnitDateMap }> {
  const store = await readJson<Store>(FILE, {});
  const k = key(slug, unitId);
  const map = store[k] ?? {};
  const clean: RateOverride = {};
  if (typeof override.price === "number" && override.price >= 0) clean.price = override.price;
  if (typeof override.units === "number" && override.units >= 0) clean.units = override.units;
  if (Object.keys(clean).length === 0) {
    delete map[date];
  } else {
    map[date] = clean;
  }
  if (Object.keys(map).length === 0) delete store[k];
  else store[k] = map;
  await writeJson(FILE, store);
  return { ok: true, dates: store[k] ?? {} };
}

/** Drop every override for a unit (used when the unit is deleted). */
export async function clearUnitRates(slug: string, unitId: string): Promise<void> {
  const store = await readJson<Store>(FILE, {});
  const k = key(slug, unitId);
  if (store[k]) {
    delete store[k];
    await writeJson(FILE, store);
  }
}
