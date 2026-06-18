"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readJson, writeJson } from "@/lib/storage";
import type { Villa } from "@/lib/types";
import { parseVideoUrl } from "@/lib/video";
import { deleteDraft, saveDraft } from "@/lib/data/villa-drafts";

const VillaSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, dashes only"),
  propertyType: z.enum(["villa", "apartment"]).default("villa"),
  name: z.string().min(2),
  tagline: z.string().min(5),
  description: z.string().min(20),
  destinationSlug: z.string().min(2),
  collections: z.array(z.string()).default([]),
  bedrooms: z.coerce.number().int().min(1).max(40),
  bathrooms: z.coerce.number().int().min(1).max(40),
  maxGuests: z.coerce.number().int().min(1).max(80),
  pricePerNight: z.coerce.number().int().min(1000),
  rating: z.coerce.number().min(0).max(5).default(4.8),
  reviewCount: z.coerce.number().int().min(0).default(0),
  amenities: z.array(z.string()).default([]),
  facilities: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  houseRules: z.array(z.string()).default([]),
  images: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string().min(1),
        tag: z.string().optional(),
      }),
    )
    .min(1, "At least one photo required"),
  locationNote: z.string().min(5),
  state: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  cancellationPreset: z
    .enum(["flexible", "moderate", "strict", "custom"])
    .optional(),
  cancellationDescription: z.string().optional(),
  mealsPreset: z
    .enum([
      "self-catering",
      "breakfast",
      "all-meals",
      "chef-included",
      "chef-on-request",
      "custom",
    ])
    .optional(),
  mealsDescription: z.string().optional(),
  videoSrc: z.string().optional(),
  faqs: z
    .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }))
    .default([]),
  externalListings: z
    .array(
      z.object({
        platform: z.string().min(1),
        url: z.string().url(),
        rating: z.number().min(0).max(5).optional(),
        reviewCount: z.number().int().min(0).optional(),
      }),
    )
    .default([]),
  featured: z.boolean().default(false),
  featuredRank: z.coerce.number().int().min(1).max(6).optional(),
});

function numOrUndef(v: FormDataEntryValue | null): number | undefined {
  if (v === null) return undefined;
  const s = String(v).trim();
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function parseLines(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseImagesJson(
  raw: string | undefined | null,
): { src: string; alt: string; tag?: string }[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (x): x is { src: string; alt: string; tag?: string } =>
          x && typeof x.src === "string" && typeof x.alt === "string",
      )
      .map((x) => {
        const tag = typeof x.tag === "string" ? x.tag.trim() : "";
        return {
          src: x.src,
          alt: x.alt || "Villa photo",
          ...(tag ? { tag } : {}),
        };
      });
  } catch {
    return [];
  }
}

function parseExternalListingsJson(raw: string | undefined | null) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (x) =>
          x && typeof x.platform === "string" && typeof x.url === "string" && x.url.length > 0,
      )
      .map((x) => ({
        platform: String(x.platform).trim(),
        url: String(x.url).trim(),
        rating:
          typeof x.rating === "number" && Number.isFinite(x.rating) ? x.rating : undefined,
        reviewCount:
          typeof x.reviewCount === "number" && Number.isFinite(x.reviewCount)
            ? Math.floor(x.reviewCount)
            : undefined,
      }));
  } catch {
    return [];
  }
}

function parseFaqsJson(raw: string | undefined | null): { question: string; answer: string }[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (x): x is { question: string; answer: string } =>
          x && typeof x.question === "string" && typeof x.answer === "string",
      )
      .map((x) => ({ question: x.question.trim(), answer: x.answer.trim() }))
      .filter((x) => x.question && x.answer);
  } catch {
    return [];
  }
}

export type AddVillaValues = {
  slug: string;
  propertyType: "villa" | "apartment";
  name: string;
  tagline: string;
  description: string;
  destinationSlug: string;
  collections: string[];
  bedrooms: string;
  bathrooms: string;
  maxGuests: string;
  pricePerNight: string;
  rating: string;
  reviewCount: string;
  amenities: string[];
  customAmenities: string;
  facilities: string[];
  customFacilities: string;
  highlights: string;
  houseRules: string;
  locationNote: string;
  state: string;
  city: string;
  latitude: string;
  longitude: string;
  cancellationPreset: string;
  cancellationDescription: string;
  mealsPreset: string;
  mealsDescription: string;
  videoSrc: string;
  faqs: { question: string; answer: string }[];
  externalListings: { platform: string; url: string; rating?: number; reviewCount?: number }[];
  featured: boolean;
  featuredRank: string;
  images: { src: string; alt: string }[];
};

export type AddVillaState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: AddVillaValues;
  attemptId?: number;
};

export async function addVilla(
  _prev: AddVillaState,
  form: FormData,
): Promise<AddVillaState> {
  // Combine preset amenities (checkboxes) with custom amenities (comma/newline separated)
  const presetAmenities = form.getAll("amenities").map((v) => String(v));
  const customAmenities = parseLines(form.get("customAmenities") as string);
  const presetFacilities = form.getAll("facilities").map((v) => String(v));
  const customFacilities = parseLines(form.get("customFacilities") as string);

  const raw = {
    slug: String(form.get("slug") ?? "").trim().toLowerCase(),
    propertyType: (String(form.get("propertyType") ?? "villa") === "apartment"
      ? "apartment"
      : "villa") as "villa" | "apartment",
    name: String(form.get("name") ?? "").trim(),
    tagline: String(form.get("tagline") ?? "").trim(),
    description: String(form.get("description") ?? "").trim(),
    destinationSlug: String(form.get("destinationSlug") ?? "").trim(),
    collections: form.getAll("collections").map((v) => String(v)),
    bedrooms: form.get("bedrooms"),
    bathrooms: form.get("bathrooms"),
    maxGuests: form.get("maxGuests"),
    pricePerNight: form.get("pricePerNight"),
    rating: form.get("rating"),
    reviewCount: form.get("reviewCount"),
    amenities: Array.from(new Set([...presetAmenities, ...customAmenities])),
    facilities: Array.from(new Set([...presetFacilities, ...customFacilities])),
    highlights: parseLines(form.get("highlights") as string),
    houseRules: parseLines(form.get("houseRules") as string),
    images: parseImagesJson(form.get("imagesJson") as string),
    locationNote: String(form.get("locationNote") ?? "").trim(),
    state: String(form.get("state") ?? "").trim() || undefined,
    city: String(form.get("city") ?? "").trim() || undefined,
    latitude: numOrUndef(form.get("latitude")),
    longitude: numOrUndef(form.get("longitude")),
    cancellationPreset: (form.get("cancellationPreset") as string) || undefined,
    cancellationDescription: String(form.get("cancellationDescription") ?? "").trim() || undefined,
    mealsPreset: (form.get("mealsPreset") as string) || undefined,
    mealsDescription: String(form.get("mealsDescription") ?? "").trim() || undefined,
    videoSrc: String(form.get("videoSrc") ?? "").trim(),
    faqs: parseFaqsJson(form.get("faqsJson") as string),
    externalListings: parseExternalListingsJson(form.get("externalListingsJson") as string),
    featured: form.get("featured") === "on" || form.get("featured") === "true",
    featuredRank: numOrUndef(form.get("featuredRank")),
  };

  // Snapshot the raw form values so we can repopulate the form on error
  const snapshot: AddVillaValues = {
    slug: raw.slug,
    propertyType: raw.propertyType,
    name: raw.name,
    tagline: raw.tagline,
    description: raw.description,
    destinationSlug: raw.destinationSlug,
    collections: raw.collections,
    bedrooms: String(raw.bedrooms ?? ""),
    bathrooms: String(raw.bathrooms ?? ""),
    maxGuests: String(raw.maxGuests ?? ""),
    pricePerNight: String(raw.pricePerNight ?? ""),
    rating: String(raw.rating ?? ""),
    reviewCount: String(raw.reviewCount ?? ""),
    amenities: presetAmenities,
    customAmenities: String(form.get("customAmenities") ?? ""),
    facilities: presetFacilities,
    customFacilities: String(form.get("customFacilities") ?? ""),
    highlights: String(form.get("highlights") ?? ""),
    houseRules: String(form.get("houseRules") ?? ""),
    locationNote: raw.locationNote,
    state: raw.state ?? "",
    city: raw.city ?? "",
    latitude: raw.latitude !== undefined ? String(raw.latitude) : "",
    longitude: raw.longitude !== undefined ? String(raw.longitude) : "",
    cancellationPreset: raw.cancellationPreset ?? "",
    cancellationDescription: raw.cancellationDescription ?? "",
    mealsPreset: raw.mealsPreset ?? "",
    mealsDescription: raw.mealsDescription ?? "",
    videoSrc: raw.videoSrc,
    faqs: raw.faqs,
    externalListings: raw.externalListings,
    featured: raw.featured,
    featuredRank:
      raw.featuredRank !== undefined ? String(raw.featuredRank) : "",
    images: raw.images,
  };

  const parsed = VillaSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat.fieldErrors)) {
      if (v && v.length > 0) fieldErrors[k] = v[0]!;
    }
    const errorCount = Object.keys(fieldErrors).length;
    return {
      ok: false,
      error:
        flat.formErrors[0] ??
        `${errorCount} field${errorCount === 1 ? "" : "s"} need${errorCount === 1 ? "s" : ""} attention`,
      fieldErrors,
      values: snapshot,
      attemptId: Date.now(),
    };
  }

  const d = parsed.data;
  const villa: Villa = {
    slug: d.slug,
    type: d.propertyType,
    name: d.name,
    tagline: d.tagline,
    description: d.description,
    destinationSlug: d.destinationSlug,
    collections: d.collections,
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    maxGuests: d.maxGuests,
    pricePerNight: d.pricePerNight,
    rating: d.rating,
    reviewCount: d.reviewCount,
    amenities: d.amenities,
    facilities: d.facilities.length > 0 ? d.facilities : undefined,
    highlights: d.highlights,
    houseRules: d.houseRules,
    images: d.images,
    locationNote: d.locationNote,
    state: d.state,
    city: d.city,
    latitude: typeof d.latitude === "number" ? d.latitude : undefined,
    longitude: typeof d.longitude === "number" ? d.longitude : undefined,
    cancellationPolicy:
      d.cancellationPreset || d.cancellationDescription
        ? {
            preset: d.cancellationPreset,
            description: d.cancellationDescription,
          }
        : undefined,
    meals:
      d.mealsPreset || d.mealsDescription
        ? {
            preset: d.mealsPreset,
            description: d.mealsDescription,
          }
        : undefined,
    video: parseVideoUrl(d.videoSrc) ?? undefined,
    faqs: d.faqs.length > 0 ? d.faqs : undefined,
    externalListings: d.externalListings.length > 0 ? d.externalListings : undefined,
    featured: d.featured,
    featuredRank: d.featured ? d.featuredRank : undefined,
  };

  const list = await readJson<Villa[]>("villas.json", []);
  const idx = list.findIndex((v) => v.slug === villa.slug);
  if (idx >= 0) list[idx] = villa;
  else list.push(villa);
  await writeJson("villas.json", list);

  // If this publish originated from a draft, clean it up so it stops
  // showing in the drafts list.
  const draftId = form.get("draftId");
  if (typeof draftId === "string" && draftId) {
    await deleteDraft(draftId);
    revalidatePath("/admin/villas/drafts");
  }

  revalidatePath("/admin/villas");
  revalidatePath("/villas");
  revalidatePath(`/villas/${villa.slug}`);
  revalidatePath("/");
  redirect("/admin/villas?added=" + encodeURIComponent(villa.slug));
}

/**
 * Auto-save the in-progress form snapshot to data/villa-drafts.json.
 * Fire-and-forget from the client every few seconds — we don't validate
 * here because half-filled forms are exactly the point.
 */
export async function autoSaveDraft(
  draftId: string,
  values: Partial<AddVillaValues>,
): Promise<{ ok: true; savedAt: string }> {
  await saveDraft(draftId, values);
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function discardDraft(
  draftId: string,
): Promise<{ ok: true }> {
  await deleteDraft(draftId);
  revalidatePath("/admin/villas/drafts");
  revalidatePath("/admin/villas");
  return { ok: true };
}
