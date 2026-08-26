"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import type { JournalMedia } from "@/lib/journal/types";
import { addMedia, updateMedia, deleteMedia } from "@/lib/data/journal-media";

/** Register an asset that was just uploaded through /api/admin/upload. */
export async function recordUploadedMedia(entry: {
  url: string;
  fileName: string;
  kind: JournalMedia["kind"];
  sizeBytes?: number;
  folder?: string;
}): Promise<{ ok: boolean; media?: JournalMedia }> {
  await requireAdmin();
  const media = await addMedia(entry);
  revalidatePath("/admin/journal/media");
  return { ok: true, media };
}

export async function updateMediaMeta(
  id: string,
  patch: Partial<Pick<JournalMedia, "alt" | "caption" | "credit" | "folder">>,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  await updateMedia(id, patch);
  revalidatePath("/admin/journal/media");
  return { ok: true };
}

export async function removeMedia(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await deleteMedia(id);
  revalidatePath("/admin/journal/media");
  return { ok: true };
}
