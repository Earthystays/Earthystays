"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readJson, writeJson } from "@/lib/storage";
import type { Villa } from "@/lib/types";

export async function deleteVilla(slug: string): Promise<void> {
  await requireAdmin();
  // 1. Remove from admin-added overrides
  const list = await readJson<Villa[]>("villas.json", []);
  const filtered = list.filter((v) => v.slug !== slug);
  await writeJson("villas.json", filtered);

  // 2. Record the slug as deleted so bundled SEED villas with this slug
  //    don't reappear on the next page load. (Idempotent — re-deleting an
  //    already-deleted slug is a no-op.)
  const deleted = await readJson<string[]>("deleted-villas.json", []);
  if (!deleted.includes(slug)) {
    deleted.push(slug);
    await writeJson("deleted-villas.json", deleted);
  }

  await logAdminAction({
    action: "property.deleted",
    entity: "villa",
    entityId: slug,
    summary: `Property deleted: ${slug}`,
  });

  revalidatePath("/admin/villas");
  revalidatePath("/villas");
  revalidatePath("/apartments");
  revalidatePath(`/villas/${slug}`);
  revalidatePath("/");
  redirect("/admin/villas?deleted=" + encodeURIComponent(slug));
}
