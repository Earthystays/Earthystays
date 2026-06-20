"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import type { GuestType, StoredReview } from "@/lib/data/reviews";
import { getVillaBySlug } from "@/lib/data/villas";

const FILE = "reviews.json";

function newId(): string {
  return `rv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const GUEST_TYPE_SET = new Set([
  "Family",
  "Couple",
  "Friends",
  "Corporate",
  "Solo",
]);

function readGuestType(v: FormDataEntryValue | null): GuestType | undefined {
  if (typeof v !== "string") return undefined;
  return GUEST_TYPE_SET.has(v) ? (v as GuestType) : undefined;
}

function bool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true";
}

export async function saveReview(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const id = String(formData.get("id") ?? "").trim();
  const guestName = String(formData.get("guestName") ?? "").trim();
  const guestPhoto = String(formData.get("guestPhoto") ?? "").trim();
  const guestLocation = String(formData.get("guestLocation") ?? "").trim();
  const villaSlug = String(formData.get("villaSlug") ?? "").trim();
  const villaNameFallback = String(formData.get("villaName") ?? "").trim();
  const locationFallback = String(formData.get("location") ?? "").trim();
  const stayMonth = String(formData.get("stayMonth") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "5");
  const rating = Math.min(5, Math.max(1, Number(ratingRaw)));
  const guestType = readGuestType(formData.get("guestType"));
  const featured = bool(formData.get("featured"));
  const showPhoto = formData.get("showPhoto") === null
    ? true // not in form (e.g. legacy submission) → default true
    : bool(formData.get("showPhoto"));
  const active = formData.get("active") === null
    ? true
    : bool(formData.get("active"));

  if (guestName.length < 2) return { ok: false, error: "Guest name is required." };
  if (quote.length < 10) return { ok: false, error: "Review text is too short." };
  if (!Number.isFinite(rating)) return { ok: false, error: "Pick a rating." };

  // Derive villa name + destination from the linked villa if one is
  // selected; otherwise fall back to the free-text fields.
  let resolvedVillaName = villaNameFallback || undefined;
  let resolvedLocation = locationFallback || undefined;
  if (villaSlug) {
    const v = getVillaBySlug(villaSlug);
    if (v) {
      resolvedVillaName = v.name;
      resolvedLocation = [v.city, v.state].filter(Boolean).join(", ") || undefined;
    }
  }

  const list = await readJson<StoredReview[]>(FILE, []);
  const fields: Partial<StoredReview> = {
    guestName,
    guestPhoto: guestPhoto || undefined,
    guestLocation: guestLocation || undefined,
    villaSlug: villaSlug || undefined,
    villaName: resolvedVillaName,
    location: resolvedLocation,
    stayMonth: stayMonth || undefined,
    title: title || undefined,
    quote,
    rating,
    guestType,
    featured,
    showPhoto,
    active,
  };

  if (id) {
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...fields };
  } else {
    list.unshift({
      id: newId(),
      ...fields,
      guestName,
      quote,
      rating,
      createdAt: new Date().toISOString(),
      source: "direct",
    } as StoredReview);
  }
  await writeJson(FILE, list);

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidatePath("/villas");
  return { ok: true };
}

export async function deleteReview(id: string): Promise<{ ok: boolean }> {
  const list = await readJson<StoredReview[]>(FILE, []);
  await writeJson(
    FILE,
    list.filter((r) => r.id !== id),
  );
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidatePath("/villas");
  return { ok: true };
}
