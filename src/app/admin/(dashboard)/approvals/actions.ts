"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import { notifyHostOfListingReview } from "@/lib/notify";
import { pingIndexNow } from "@/lib/indexnow";
import type { Villa } from "@/lib/types";

function revalidateAll(slug: string) {
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/villas");
  revalidatePath("/host/listings");
  revalidatePath("/host");
  revalidatePath(`/villas/${slug}`);
  revalidatePath("/villas");
  revalidatePath("/apartments");
  revalidatePath("/");
}

export async function approveListing(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "");
  const list = await readJson<Villa[]>("villas.json", []);
  const idx = list.findIndex((v) => v.slug === slug);
  if (idx < 0) return;
  list[idx].status = "approved";
  list[idx].rejectedReason = undefined;
  await writeJson("villas.json", list);
  await notifyHostOfListingReview(list[idx], "approved");
  void pingIndexNow([`https://earthystays.com/villas/${slug}`]);
  revalidateAll(slug);
}

export async function rejectListing(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const list = await readJson<Villa[]>("villas.json", []);
  const idx = list.findIndex((v) => v.slug === slug);
  if (idx < 0) return;
  list[idx].status = "rejected";
  list[idx].rejectedReason = reason || "Please review and improve your listing details.";
  await writeJson("villas.json", list);
  await notifyHostOfListingReview(list[idx], "rejected", list[idx].rejectedReason);
  revalidateAll(slug);
}
