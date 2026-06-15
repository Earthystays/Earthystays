"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import type { Collection } from "@/lib/types";
import { isSeedCollection } from "@/lib/data/collections";

const FILE = "admin-collections.json";

type AdminCollections = {
  overrides?: Record<
    string,
    { name?: string; blurb?: string; image?: { src: string; alt: string } }
  >;
  added?: Collection[];
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
  revalidatePath("/collections");
  revalidatePath("/admin/collections");
}

export async function addCollection(formData: FormData): Promise<{
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
  const admin = await readJson<AdminCollections>(FILE, {});
  admin.added = admin.added ?? [];
  admin.deleted = (admin.deleted ?? []).filter((s) => s !== slug);

  if (isSeedCollection(slug) || admin.added.some((c) => c.slug === slug)) {
    return {
      ok: false,
      error: `A collection with the slug "${slug}" already exists.`,
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

export async function updateCollection(
  slug: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const blurb = String(formData.get("blurb") ?? "").trim();
  const imageSrc = String(formData.get("imageSrc") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim() || name;

  if (name.length < 2) return { ok: false, error: "Name is required." };
  if (!imageSrc) return { ok: false, error: "Cover image is required." };

  const admin = await readJson<AdminCollections>(FILE, {});

  if (isSeedCollection(slug)) {
    // Seed collection — write to overrides
    admin.overrides = admin.overrides ?? {};
    admin.overrides[slug] = {
      name,
      blurb,
      image: { src: imageSrc, alt: imageAlt },
    };
  } else {
    // Admin-added — patch in place
    admin.added = (admin.added ?? []).map((c) =>
      c.slug === slug
        ? { ...c, name, blurb, image: { src: imageSrc, alt: imageAlt } }
        : c,
    );
  }

  await writeJson(FILE, admin);
  revalidateAll();
  return { ok: true };
}

export async function deleteCollection(slug: string): Promise<{ ok: boolean }> {
  const admin = await readJson<AdminCollections>(FILE, {});
  admin.added = (admin.added ?? []).filter((c) => c.slug !== slug);
  if (isSeedCollection(slug)) {
    admin.deleted = Array.from(new Set([...(admin.deleted ?? []), slug]));
  }
  await writeJson(FILE, admin);
  revalidateAll();
  return { ok: true };
}
