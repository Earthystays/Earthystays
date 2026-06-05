"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";

const FILE = "location-covers.json";

type Covers = Record<string, string>;

export async function setLocationCover(
  key: string,
  url: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!key || !url) return { ok: false, error: "Missing key or URL" };
  const covers = await readJson<Covers>(FILE, {});
  covers[key] = url;
  await writeJson(FILE, covers);
  revalidatePath("/locations");
  revalidatePath(`/locations/${key.split("/")[0]}`);
  if (key.includes("/")) revalidatePath(`/locations/${key}`);
  revalidatePath("/admin/locations");
  return { ok: true };
}

export async function clearLocationCover(
  key: string,
): Promise<{ ok: boolean; error?: string }> {
  const covers = await readJson<Covers>(FILE, {});
  delete covers[key];
  await writeJson(FILE, covers);
  revalidatePath("/locations");
  revalidatePath(`/locations/${key.split("/")[0]}`);
  if (key.includes("/")) revalidatePath(`/locations/${key}`);
  revalidatePath("/admin/locations");
  return { ok: true };
}
