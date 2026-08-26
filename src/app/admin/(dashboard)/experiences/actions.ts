"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { revalidatePath } from "next/cache";
import type { Experience, ExperienceStatus } from "@/lib/types";
import { readExperiences, saveExperiences, experienceHref } from "@/lib/data/experiences";
import { slugify } from "@/lib/slug";

type Result = { ok: boolean; error?: string; slug?: string };

function revalidate(exp?: Pick<Experience, "slug" | "citySlug">) {
  revalidatePath("/");
  revalidatePath("/experiences");
  if (exp?.citySlug) revalidatePath(`/experiences/${exp.citySlug}`);
  if (exp) revalidatePath(experienceHref(exp));
  revalidatePath("/admin/experiences");
}

/** Create or update — the editor sends the whole Experience object. The
 *  slug is derived from the name on create and never changes afterwards. */
export async function saveExperience(
  input: Experience,
  originalSlug?: string,
): Promise<Result> {
  await requireAdmin();
  const name = (input.name ?? "").trim();
  if (name.length < 2) return { ok: false, error: "Name is required." };
  if (!input.image?.src) return { ok: false, error: "A cover image is required." };

  const list = await readExperiences();
  const now = new Date().toISOString();

  if (originalSlug) {
    const idx = list.findIndex((e) => e.slug === originalSlug);
    if (idx === -1) return { ok: false, error: "Experience not found." };
    const merged: Experience = {
      ...list[idx],
      ...input,
      slug: originalSlug,
      updatedAt: now,
      createdAt: list[idx].createdAt ?? now,
    };
    list[idx] = merged;
    await saveExperiences(list);
    await logAdminAction({
      action: "experience.edited",
      entity: "experience",
      entityId: merged.slug,
      summary: `Experience edited: ${merged.name ?? merged.slug}`,
    });
    revalidate(merged);
    return { ok: true, slug: merged.slug };
  }

  // Create
  let slug = slugify(name);
  if (!slug) return { ok: false, error: "Could not derive a slug from the name." };
  if (list.some((e) => e.slug === slug)) {
    // De-dupe by appending a short suffix.
    slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
  }
  const created: Experience = {
    ...input,
    slug,
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(created);
  await saveExperiences(list);
  await logAdminAction({
    action: "experience.created",
    entity: "experience",
    entityId: created.slug,
    summary: `Experience created: ${created.name ?? created.slug}`,
  });
  revalidate(created);
  return { ok: true, slug };
}

export async function setExperienceStatus(
  slug: string,
  status: ExperienceStatus,
): Promise<Result> {
  await requireAdmin();
  const list = await readExperiences();
  const idx = list.findIndex((e) => e.slug === slug);
  if (idx === -1) return { ok: false, error: "Not found." };
  list[idx] = { ...list[idx], status, updatedAt: new Date().toISOString() };
  await saveExperiences(list);
  await logAdminAction({
    action: "experience.status_changed",
    entity: "experience",
    entityId: slug,
    summary: `Experience status set to ${status}`,
  });
  revalidate(list[idx]);
  return { ok: true };
}

export async function duplicateExperience(slug: string): Promise<Result> {
  await requireAdmin();
  const list = await readExperiences();
  const src = list.find((e) => e.slug === slug);
  if (!src) return { ok: false, error: "Not found." };
  let newSlug = `${src.slug}-copy`;
  while (list.some((e) => e.slug === newSlug)) newSlug = `${newSlug}-${Math.floor(Math.random() * 9)}`;
  const now = new Date().toISOString();
  const copy: Experience = {
    ...src,
    slug: newSlug,
    name: `${src.name} (copy)`,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(copy);
  await saveExperiences(list);
  revalidate(copy);
  return { ok: true, slug: newSlug };
}

export async function deleteExperience(slug: string): Promise<Result> {
  await requireAdmin();
  const list = await readExperiences();
  const next = list.filter((e) => e.slug !== slug);
  await saveExperiences(next);
  await logAdminAction({
    action: "experience.deleted",
    entity: "experience",
    entityId: slug,
    summary: `Experience deleted: ${slug}`,
  });
  revalidate();
  return { ok: true };
}
