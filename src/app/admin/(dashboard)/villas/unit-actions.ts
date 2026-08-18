"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import { getVillaBySlugWithHidden } from "@/lib/data/villas";
import { removeUnit, upsertUnit } from "@/lib/data/units";
import type { AccommodationUnit, Villa } from "@/lib/types";

// Admin auth is enforced by middleware (src/proxy.ts matches /admin/:path*),
// which also covers server-action POSTs to these routes — same as deleteVilla.

/**
 * Room-type (hotel) / dorm-type (hostel) persistence — Phase C/D.
 *
 * Units live on the villa record's optional `units[]`. These actions patch
 * just that array, leaving every other field untouched. Seed-only villas are
 * materialised into data/villas.json on first write (same pattern as addVilla).
 */

async function loadListAndVilla(
  slug: string,
): Promise<{ list: Villa[]; villa: Villa; inList: boolean }> {
  const list = await readJson<Villa[]>("villas.json", []);
  const idx = list.findIndex((v) => v.slug === slug);
  if (idx >= 0) return { list, villa: list[idx], inList: true };
  // Not yet overridden in JSON — pull the merged (seed) record so we can
  // persist a full copy carrying the new units.
  const seed = getVillaBySlugWithHidden(slug);
  if (!seed) throw new Error(`Villa not found: ${slug}`);
  return { list, villa: structuredClone(seed), inList: false };
}

function persist(list: Villa[], villa: Villa, inList: boolean) {
  if (inList) {
    const idx = list.findIndex((v) => v.slug === villa.slug);
    list[idx] = villa;
  } else {
    list.push(villa);
  }
  return list;
}

function revalidate(slug: string) {
  revalidatePath(`/admin/villas/${slug}/edit`);
  revalidatePath(`/villas/${slug}`);
  revalidatePath("/admin/villas");
}

/** Server-side id — never trust a client-supplied one for new units. */
function newUnitId(kind: AccommodationUnit["kind"]): string {
  return `${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Insert a new unit or update an existing one (matched by id). */
export async function saveUnit(
  slug: string,
  unit: AccommodationUnit,
): Promise<{ ok: true; unitId: string }> {
  const { list, villa, inList } = await loadListAndVilla(slug);
  const { units, unitId } = upsertUnit(villa.units ?? [], unit, newUnitId);
  villa.units = units;
  await writeJson("villas.json", persist(list, villa, inList));
  revalidate(slug);
  return { ok: true, unitId };
}

/** Remove a unit by id. */
export async function deleteUnit(
  slug: string,
  unitId: string,
): Promise<{ ok: true }> {
  const { list, villa, inList } = await loadListAndVilla(slug);
  villa.units = removeUnit(villa.units ?? [], unitId);
  await writeJson("villas.json", persist(list, villa, inList));
  revalidate(slug);
  return { ok: true };
}
