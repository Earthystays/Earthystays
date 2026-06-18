import { readJson, writeJson } from "@/lib/storage";
import type { AddVillaValues } from "@/app/admin/(dashboard)/villas/new/actions";

const FILE = "villa-drafts.json";

export type VillaDraft = {
  id: string;
  values: Partial<AddVillaValues>;
  updatedAt: string;
};

type DraftStore = Record<string, VillaDraft>;

export async function getAllDrafts(): Promise<VillaDraft[]> {
  const store = await readJson<DraftStore>(FILE, {});
  return Object.values(store).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function getDraftById(id: string): Promise<VillaDraft | undefined> {
  const store = await readJson<DraftStore>(FILE, {});
  return store[id];
}

export async function saveDraft(
  id: string,
  values: Partial<AddVillaValues>,
): Promise<void> {
  const store = await readJson<DraftStore>(FILE, {});
  store[id] = { id, values, updatedAt: new Date().toISOString() };
  await writeJson(FILE, store);
}

export async function deleteDraft(id: string): Promise<void> {
  const store = await readJson<DraftStore>(FILE, {});
  if (!(id in store)) return;
  delete store[id];
  await writeJson(FILE, store);
}

export function deriveDraftLabel(values: Partial<AddVillaValues>): string {
  const name = (values.name ?? "").trim();
  if (name) return name;
  const slug = (values.slug ?? "").trim();
  if (slug) return slug;
  const tagline = (values.tagline ?? "").trim();
  if (tagline) return tagline.slice(0, 40);
  return "Untitled draft";
}
