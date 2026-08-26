"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import type { ExperienceCategory } from "@/lib/types";
import { saveCategories } from "@/lib/data/experience-categories";
import { slugify } from "@/lib/slug";

export async function saveCategoryList(
  list: ExperienceCategory[],
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const cleaned: ExperienceCategory[] = [];
  const seen = new Set<string>();
  for (const c of list) {
    const name = (c.name ?? "").trim();
    if (!name) continue;
    const slug = c.slug?.trim() || slugify(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    cleaned.push({ slug, name, icon: c.icon?.trim() || undefined });
  }
  await saveCategories(cleaned);
  revalidatePath("/admin/experience-categories");
  revalidatePath("/admin/experiences");
  revalidatePath("/experiences");
  return { ok: true };
}
