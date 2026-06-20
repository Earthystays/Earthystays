"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import type { StoredReview } from "@/lib/data/reviews";

const FILE = "reviews.json";

function newId(): string {
  return `rv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveReview(
  prev: { ok: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const id = String(formData.get("id") ?? "").trim();
  const guestName = String(formData.get("guestName") ?? "").trim();
  const villaName = String(formData.get("villaName") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const stayMonth = String(formData.get("stayMonth") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "5");
  const rating = Math.min(5, Math.max(1, Number(ratingRaw)));

  if (guestName.length < 2) return { ok: false, error: "Guest name is required." };
  if (quote.length < 10) return { ok: false, error: "Review text is too short." };
  if (!Number.isFinite(rating)) return { ok: false, error: "Pick a rating." };

  const list = await readJson<StoredReview[]>(FILE, []);
  if (id) {
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        guestName,
        villaName: villaName || undefined,
        location: location || undefined,
        stayMonth: stayMonth || undefined,
        quote,
        rating,
      };
    }
  } else {
    list.unshift({
      id: newId(),
      guestName,
      villaName: villaName || undefined,
      location: location || undefined,
      quote,
      rating,
      createdAt: new Date().toISOString(),
    });
  }
  await writeJson(FILE, list);

  revalidatePath("/admin/reviews");
  revalidatePath("/");
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
  return { ok: true };
}
