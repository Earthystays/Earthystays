"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import type { Villa } from "@/lib/types";
import {
  downloadImageToUploads,
  importListingFromUrl,
  slugifyName,
} from "@/lib/listing-import";
import { getVillas } from "@/lib/data/villas";

/**
 * One-click import: paste a URL → fetch metadata → create a stub villa →
 * return the slug so the client can redirect to the edit page.
 *
 * Anything the scraper can't extract (price, beds, amenities, full
 * gallery) is left as a sensible default for the admin to fill in.
 */
export async function importListingAction(formData: FormData): Promise<
  | { ok: true; slug: string; warnings: string[] }
  | { ok: false; error: string }
> {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { ok: false, error: "Paste a listing URL." };

  const result = await importListingFromUrl(url);
  if (!result.ok) return { ok: false, error: result.error };

  const data = result.data;
  const warnings: string[] = [];

  // Generate a unique slug
  const allVillas = getVillas();
  const usedSlugs = new Set(allVillas.map((v) => v.slug));
  const baseSlug = slugifyName(data.name ?? `${data.platform.toLowerCase()}-import`);
  let slug = baseSlug;
  let n = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${n++}`;
  }

  // Download the hero image(s) into public/uploads so they survive.
  // Cap at 4 to avoid burning bandwidth on listings with huge galleries
  // that we then might fail on partway through.
  const images: { src: string; alt: string }[] = [];
  const TO_DOWNLOAD = data.imageUrls.slice(0, 4);
  for (const src of TO_DOWNLOAD) {
    const dl = await downloadImageToUploads(src);
    if (dl.ok) {
      images.push({ src: dl.path, alt: data.name ?? "Imported photo" });
    } else {
      warnings.push(`Could not download an image — saved the URL as-is.`);
      // Skip remote URL fallback for now (would need remotePatterns config)
    }
  }

  // Stub villa with sensible defaults — admin completes in the edit form
  const stub: Villa = {
    slug,
    name: data.name ?? `Imported from ${data.platform}`,
    tagline: data.description?.split(/[.!?]/)[0]?.trim().slice(0, 140) ?? "",
    description: data.description ?? "",
    destinationSlug: "",
    state: data.state,
    city: data.city,
    collections: [],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    pricePerNight: 0,
    rating: data.rating ?? 0,
    reviewCount: data.reviewCount ?? 0,
    amenities: [],
    highlights: [],
    images,
    houseRules: [],
    locationNote: "",
    type: "villa",
    externalListings: [
      {
        platform: data.platform,
        url,
        rating: data.rating,
        reviewCount: data.reviewCount,
      },
    ],
    featured: false,
  };

  const list = await readJson<Villa[]>("villas.json", []);
  list.push(stub);
  await writeJson("villas.json", list);

  revalidatePath("/admin/villas");
  revalidatePath("/villas");

  return { ok: true, slug, warnings };
}
