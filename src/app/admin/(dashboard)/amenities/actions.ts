"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import type { AmenityKind, StoredAmenity } from "@/lib/data/amenities-store";

const FILE = "amenities.json";

export async function addAmenity(
  name: string,
  icon: string,
  kind: AmenityKind,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, error: "Name too short" };
  if (!icon) return { ok: false, error: "Pick an icon" };

  const list = await readJson<StoredAmenity[]>(FILE, []);
  // Replace if same name + kind already exists, else append
  const idx = list.findIndex(
    (a) => a.name.toLowerCase() === trimmed.toLowerCase() && a.kind === kind,
  );
  if (idx >= 0) list[idx] = { name: trimmed, icon, kind };
  else list.push({ name: trimmed, icon, kind });
  await writeJson(FILE, list);

  revalidatePath("/admin/amenities");
  // Bump villa pages since icons may now resolve differently
  revalidatePath("/villas/[slug]", "page");
  return { ok: true };
}

export async function removeAmenity(
  name: string,
  kind: AmenityKind,
): Promise<{ ok: boolean; error?: string }> {
  const list = await readJson<StoredAmenity[]>(FILE, []);
  const next = list.filter(
    (a) => !(a.name.toLowerCase() === name.toLowerCase() && a.kind === kind),
  );
  await writeJson(FILE, next);
  revalidatePath("/admin/amenities");
  revalidatePath("/villas/[slug]", "page");
  return { ok: true };
}
