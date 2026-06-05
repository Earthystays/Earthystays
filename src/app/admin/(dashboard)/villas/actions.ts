"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readJson, writeJson } from "@/lib/storage";
import type { Villa } from "@/lib/types";

export async function deleteVilla(slug: string): Promise<void> {
  const list = await readJson<Villa[]>("villas.json", []);
  const filtered = list.filter((v) => v.slug !== slug);
  await writeJson("villas.json", filtered);
  revalidatePath("/admin/villas");
  revalidatePath("/villas");
  revalidatePath(`/villas/${slug}`);
  revalidatePath("/");
  redirect("/admin/villas?deleted=" + encodeURIComponent(slug));
}
