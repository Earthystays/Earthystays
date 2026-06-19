"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import type { Experience } from "@/lib/types";
import { isSeedExperience } from "@/lib/data/experiences";

const FILE = "admin-experiences.json";

type AdminExperiences = {
  overrides?: Record<
    string,
    { name?: string; blurb?: string; image?: { src: string; alt: string } }
  >;
  added?: Experience[];
  deleted?: string[];
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/experiences");
  revalidatePath("/admin/experiences");
}

export async function addExperience(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const name = String(formData.get("name") ?? "").trim();
  const blurb = String(formData.get("blurb") ?? "").trim();
  const imageSrc = String(formData.get("imageSrc") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim() || name;

  if (name.length < 2) return { ok: false, error: "Name is required." };
  if (!imageSrc) return { ok: false, error: "Upload a cover image." };

  const slug = slugify(name);
  const admin = await readJson<AdminExperiences>(FILE, {});
  admin.added = admin.added ?? [];
  admin.deleted = (admin.deleted ?? []).filter((s) => s !== slug);

  if (isSeedExperience(slug) || admin.added.some((e) => e.slug === slug)) {
    return {
      ok: false,
      error: `An experience with the slug "${slug}" already exists.`,
    };
  }

  admin.added.push({
    slug,
    name,
    blurb,
    image: { src: imageSrc, alt: imageAlt },
  });

  await writeJson(FILE, admin);
  revalidateAll();
  return { ok: true };
}

export async function updateExperience(
  slug: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const blurb = String(formData.get("blurb") ?? "").trim();
  const imageSrc = String(formData.get("imageSrc") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim() || name;

  if (name.length < 2) return { ok: false, error: "Name is required." };
  if (!imageSrc) return { ok: false, error: "Cover image is required." };

  const admin = await readJson<AdminExperiences>(FILE, {});

  if (isSeedExperience(slug)) {
    admin.overrides = admin.overrides ?? {};
    admin.overrides[slug] = {
      name,
      blurb,
      image: { src: imageSrc, alt: imageAlt },
    };
  } else {
    admin.added = (admin.added ?? []).map((e) =>
      e.slug === slug
        ? { ...e, name, blurb, image: { src: imageSrc, alt: imageAlt } }
        : e,
    );
  }

  await writeJson(FILE, admin);
  revalidateAll();
  return { ok: true };
}

export async function deleteExperience(slug: string): Promise<{ ok: boolean }> {
  const admin = await readJson<AdminExperiences>(FILE, {});
  admin.added = (admin.added ?? []).filter((e) => e.slug !== slug);
  if (isSeedExperience(slug)) {
    admin.deleted = Array.from(new Set([...(admin.deleted ?? []), slug]));
  }
  await writeJson(FILE, admin);
  revalidateAll();
  return { ok: true };
}
