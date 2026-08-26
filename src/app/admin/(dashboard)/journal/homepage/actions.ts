"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import type { JournalHomepage } from "@/lib/journal/types";
import { saveHomepage } from "@/lib/data/journal-homepage";

export async function saveHomepageConfig(
  cfg: JournalHomepage,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  await saveHomepage(cfg);
  revalidatePath("/journal");
  revalidatePath("/admin/journal/homepage");
  return { ok: true };
}
