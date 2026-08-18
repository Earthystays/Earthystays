"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import { getCurrentUser } from "@/lib/session";
import { getVillaBySlugWithHidden } from "@/lib/data/villas";
import { getStateBySlug } from "@/lib/data/locations";
import { parseCoords, isShortMapLink, type Coords } from "@/lib/geo/parse-coords";
import type { PropertyType, Villa } from "@/lib/types";

export type WizardPayload = {
  type: PropertyType;
  name: string;
  tagline: string;
  description: string;
  destinationSlug: string;
  city: string;
  locationNote: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: { src: string; alt: string; tag?: string }[];
  pricePerNight: number;
  minNights: number;
  checkIn: string;
  checkOut: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  partiesAllowed: boolean;
  latitude?: number;
  longitude?: number;
};

export type SaveResult = { ok: boolean; error?: string; slug?: string };

export type ResolveMapResult =
  | { ok: true; coords: Coords }
  | { ok: false; error: string };

/**
 * Expand a shortened Google Maps share link (maps.app.goo.gl / goo.gl/maps)
 * and pull the pin's coordinates out of the destination it redirects to.
 * Plain "lat,lng" and full Maps URLs are parsed on the client; this only runs
 * for the short links that carry no coordinates until they're followed.
 */
export async function resolveMapLink(url: string): Promise<ResolveMapResult> {
  const trimmed = (url ?? "").trim();
  if (!isShortMapLink(trimmed)) {
    return { ok: false, error: "That doesn't look like a Google Maps link." };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    // fetch follows redirects; the final `res.url` and body carry the coords.
    const res = await fetch(trimmed, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 (compatible; EarthyStays/1.0)" },
    });
    clearTimeout(timer);

    const fromUrl = parseCoords(res.url);
    if (fromUrl) return { ok: true, coords: fromUrl };

    const body = await res.text();
    const fromBody = parseCoords(body);
    if (fromBody) return { ok: true, coords: fromBody };

    return {
      ok: false,
      error: "Couldn't read a location from that link. Try the coordinates instead.",
    };
  } catch {
    return {
      ok: false,
      error: "Couldn't reach that link. Paste the coordinates (e.g. 15.5187, 73.7629) instead.",
    };
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildHouseRules(p: WizardPayload): string[] {
  return [
    `Check-in after ${p.checkIn.trim()}, check-out before ${p.checkOut.trim()}`,
    p.petsAllowed ? "Pets are welcome" : "No pets",
    p.smokingAllowed ? "Smoking allowed in outdoor areas" : "No smoking indoors",
    p.partiesAllowed ? "Small events allowed with prior approval" : "No parties or events",
  ];
}

export async function saveListing(
  payload: WizardPayload,
  mode: "draft" | "submit",
  editingSlug?: string,
): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user?.isHost) return { ok: false, error: "You need to be signed in as a host." };

  const p = payload;

  // Drafts only need a name to hold onto; submission is validated fully.
  if (p.name.trim().length < 3) {
    return { ok: false, error: "Give your listing a title first (3+ characters)." };
  }
  if (mode === "submit") {
    if (!p.destinationSlug || !p.city.trim())
      return { ok: false, error: "Location is incomplete — pick a state and city." };
    if (p.description.trim().length < 20)
      return { ok: false, error: "Add a longer description (at least 20 characters)." };
    if (p.images.length < 3)
      return { ok: false, error: "Add at least 3 photos before submitting." };
    if (!Number.isFinite(p.pricePerNight) || p.pricePerNight < 1000)
      return { ok: false, error: "Set a nightly price of at least ₹1,000." };
  }

  const list = await readJson<Villa[]>("villas.json", []);

  let slug: string;
  let existing: Villa | undefined;
  if (editingSlug) {
    existing = list.find((x) => x.slug === editingSlug);
    if (!existing || existing.hostId !== user.id) {
      return { ok: false, error: "Listing not found in your account." };
    }
    slug = editingSlug;
  } else {
    // New listing — derive a unique slug from the title.
    const base = slugify(p.name) || `listing-${Date.now()}`;
    slug = base;
    let n = 2;
    while (getVillaBySlugWithHidden(slug) || list.some((x) => x.slug === slug)) {
      slug = `${base}-${n++}`;
    }
  }

  // Status: submissions go to review. Saving an already-live/pending
  // listing also re-enters review — nothing edited goes live unchecked.
  // Drafts and rejected listings stay put until the host submits.
  const status =
    mode === "submit"
      ? "pending_review"
      : existing && existing.status !== "draft" && existing.status !== "rejected"
        ? "pending_review"
        : (existing?.status ?? "draft");

  const villa: Villa = {
    ...(existing ?? {}),
    slug,
    type: p.type,
    name: p.name.trim(),
    tagline: p.tagline.trim() || p.name.trim(),
    description: p.description.trim(),
    destinationSlug: p.destinationSlug,
    // Store the display name ("Goa"), not the raw slug ("goa") — the admin
    // inventory and public filters read `state` as a proper-cased label.
    state: getStateBySlug(p.destinationSlug)?.name ?? existing?.state,
    collections: existing?.collections ?? [],
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    maxGuests: p.maxGuests,
    pricePerNight: p.pricePerNight,
    rating: existing?.rating ?? 5,
    reviewCount: existing?.reviewCount ?? 0,
    amenities: p.amenities,
    highlights: existing?.highlights ?? [],
    images: p.images,
    houseRules: buildHouseRules(p),
    locationNote: p.locationNote.trim() || p.city.trim(),
    city: p.city.trim(),
    // Coordinates power the map on the public listing page. Keep any
    // existing value when the host leaves the pin field untouched.
    latitude: typeof p.latitude === "number" ? p.latitude : existing?.latitude,
    longitude: typeof p.longitude === "number" ? p.longitude : existing?.longitude,
    minNights: p.minNights,
    hostId: user.id,
    status,
    // A resubmission clears the old rejection note; draft saves keep it.
    rejectedReason: mode === "submit" ? undefined : existing?.rejectedReason,
    submittedAt: mode === "submit" ? new Date().toISOString() : existing?.submittedAt,
  };

  const idx = list.findIndex((x) => x.slug === slug);
  if (idx >= 0) list[idx] = villa;
  else list.push(villa);
  await writeJson("villas.json", list);

  revalidatePath("/host/listings");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/villas");
  if (status === "pending_review") revalidatePath(`/villas/${slug}`);

  return { ok: true, slug };
}
