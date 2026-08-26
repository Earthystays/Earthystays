"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readJson, writeJson } from "@/lib/storage";
import type { PropertyType, Villa } from "@/lib/types";
import { parseVideoUrl } from "@/lib/video";
import { deleteDraft, saveDraft } from "@/lib/data/villa-drafts";
import { pingIndexNow } from "@/lib/indexnow";

const VillaSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, dashes only"),
  propertyType: z.enum(["villa", "apartment", "hotel", "hostel"]).default("villa"),
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
  googlePlaceId: z.string().trim().max(300).optional(),
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
  experiences: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  featuredRank: z.coerce.number().int().min(1).max(6).optional(),
  brochure: z
    .object({
      url: z.string().min(1),
      fileName: z.string().min(1),
      uploadedAt: z.string().min(1),
    })
    .nullable()
    .optional(),
});

function parseBrochureJson(
  raw: string | undefined | null,
): { url: string; fileName: string; uploadedAt: string } | null {
  if (!raw) return null;
  try {
    const x = JSON.parse(raw);
    if (
      x &&
      typeof x.url === "string" &&
      typeof x.fileName === "string" &&
      x.url.startsWith("/uploads/") &&
      x.url.toLowerCase().endsWith(".pdf")
    ) {
      return {
        url: x.url,
        fileName: x.fileName,
        uploadedAt:
          typeof x.uploadedAt === "string" ? x.uploadedAt : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

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
  propertyType: PropertyType;
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
  googlePlaceId: string;
  cancellationPreset: string;
  cancellationDescription: string;
  mealsPreset: string;
  mealsDescription: string;
  videoSrc: string;
  faqs: { question: string; answer: string }[];
  externalListings: { platform: string; url: string; rating?: number; reviewCount?: number }[];
  experiences: string[];
  featured: boolean;
  featuredRank: string;
  images: { src: string; alt: string }[];
  brochure: { url: string; fileName: string; uploadedAt: string } | null;
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
  await requireAdmin();
  // Combine preset amenities (checkboxes) with custom amenities (comma/newline separated)
  const presetAmenities = form.getAll("amenities").map((v) => String(v));
  const customAmenities = parseLines(form.get("customAmenities") as string);
  const presetFacilities = form.getAll("facilities").map((v) => String(v));
  const customFacilities = parseLines(form.get("customFacilities") as string);

  const raw = {
    slug: String(form.get("slug") ?? "").trim().toLowerCase(),
    propertyType: ((): PropertyType => {
      const t = String(form.get("propertyType") ?? "villa");
      return t === "apartment" || t === "hotel" || t === "hostel" ? t : "villa";
    })(),
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
    googlePlaceId: String(form.get("googlePlaceId") ?? "").trim() || undefined,
    cancellationPreset: (form.get("cancellationPreset") as string) || undefined,
    cancellationDescription: String(form.get("cancellationDescription") ?? "").trim() || undefined,
    mealsPreset: (form.get("mealsPreset") as string) || undefined,
    mealsDescription: String(form.get("mealsDescription") ?? "").trim() || undefined,
    videoSrc: String(form.get("videoSrc") ?? "").trim(),
    faqs: parseFaqsJson(form.get("faqsJson") as string),
    externalListings: parseExternalListingsJson(form.get("externalListingsJson") as string),
    experiences: form.getAll("experiences").map((v) => String(v)),
    featured: form.get("featured") === "on" || form.get("featured") === "true",
    featuredRank: numOrUndef(form.get("featuredRank")),
    brochure: parseBrochureJson(form.get("brochureJson") as string),
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
    googlePlaceId: raw.googlePlaceId ?? "",
    cancellationPreset: raw.cancellationPreset ?? "",
    cancellationDescription: raw.cancellationDescription ?? "",
    mealsPreset: raw.mealsPreset ?? "",
    mealsDescription: raw.mealsDescription ?? "",
    videoSrc: raw.videoSrc,
    faqs: raw.faqs,
    externalListings: raw.externalListings,
    experiences: raw.experiences,
    featured: raw.featured,
    featuredRank:
      raw.featuredRank !== undefined ? String(raw.featuredRank) : "",
    images: raw.images,
    brochure: raw.brochure,
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
    googlePlaceId: d.googlePlaceId || undefined,
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
    experiences: d.experiences.length > 0 ? d.experiences : undefined,
    featured: d.featured,
    featuredRank: d.featured ? d.featuredRank : undefined,
    brochure: d.brochure ?? undefined,
  };

  const list = await readJson<Villa[]>("villas.json", []);
  const idx = list.findIndex((v) => v.slug === villa.slug);
  let oldBrochureUrl: string | undefined;
  if (idx >= 0) {
    // Preserve marketplace fields the admin form doesn't carry — otherwise
    // editing a host-owned listing would silently strip its host and status.
    const prev = list[idx];
    villa.hostId = prev.hostId;
    villa.status = prev.status;
    villa.rejectedReason = prev.rejectedReason;
    villa.submittedAt = prev.submittedAt;
    villa.minNights = prev.minNights;
    // Room types / dorm types are managed by their own editor, not this
    // form — carry them over so editing the basics never wipes inventory.
    villa.units = prev.units;
    if (prev.brochure?.url && prev.brochure.url !== villa.brochure?.url) {
      oldBrochureUrl = prev.brochure.url;
    }
    list[idx] = villa;
  } else {
    list.push(villa);
  }
  const isEdit = idx >= 0;
  await writeJson("villas.json", list);

  await logAdminAction({
    action: isEdit ? "property.edited" : "property.created",
    entity: "villa",
    entityId: villa.slug,
    summary: `${isEdit ? "Edited" : "Created"} property: ${villa.name ?? villa.slug}`,
  });

  if (oldBrochureUrl && oldBrochureUrl.startsWith("/uploads/")) {
    const { promises: fsp } = await import("fs");
    const pathMod = await import("path");
    const abs = pathMod.join(process.cwd(), "public", oldBrochureUrl.replace(/^\//, ""));
    fsp.unlink(abs).catch(() => {});
  }

  // Let Bing (and other IndexNow-aware engines) know this page is new or
  // changed, instead of waiting for the next scheduled crawl.
  void pingIndexNow([`https://earthystays.com/villas/${villa.slug}`]);

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
  await requireAdmin();
  await saveDraft(draftId, values);
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function discardDraft(
  draftId: string,
): Promise<{ ok: true }> {
  await requireAdmin();
  await deleteDraft(draftId);
  revalidatePath("/admin/villas/drafts");
  revalidatePath("/admin/villas");
  return { ok: true };
}
