"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import { getCurrentUser } from "@/lib/session";
import type { Villa } from "@/lib/types";

type Result = { ok: boolean; error?: string };

async function withOwnListing(
  slug: string,
  fn: (list: Villa[], idx: number) => Promise<Result> | Result,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user?.isHost) return { ok: false, error: "Not signed in as a host" };
  const list = await readJson<Villa[]>("villas.json", []);
  const idx = list.findIndex((v) => v.slug === slug && v.hostId === user.id);
  if (idx < 0) return { ok: false, error: "Listing not found in your account" };
  return fn(list, idx);
}

function revalidateListing(slug: string) {
  revalidatePath("/host");
  revalidatePath("/host/listings");
  revalidatePath("/admin/villas");
  revalidatePath("/admin/approvals");
  revalidatePath(`/villas/${slug}`);
  revalidatePath("/villas");
  revalidatePath("/apartments");
}

/** Hide a live listing / put a hidden one back into review. */
export async function toggleListingVisibility(slug: string): Promise<Result> {
  return withOwnListing(slug, async (list, idx) => {
    const current = list[idx].status;
    if (current === "approved") list[idx].status = "hidden";
    else if (current === "hidden") list[idx].status = "approved";
    else return { ok: false, error: "Only live or hidden listings can be toggled" };
    await writeJson("villas.json", list);
    revalidateListing(slug);
    return { ok: true };
  });
}

export async function deleteListing(slug: string): Promise<Result> {
  return withOwnListing(slug, async (list, idx) => {
    list.splice(idx, 1);
    await writeJson("villas.json", list);
    revalidateListing(slug);
    return { ok: true };
  });
}

export async function duplicateListing(slug: string): Promise<Result> {
  return withOwnListing(slug, async (list, idx) => {
    const src = list[idx];
    let copySlug = `${src.slug}-copy`;
    let n = 2;
    while (list.some((v) => v.slug === copySlug)) copySlug = `${src.slug}-copy-${n++}`;
    list.push({
      ...src,
      slug: copySlug,
      name: `${src.name} (copy)`,
      status: "draft",
      submittedAt: undefined,
      rejectedReason: undefined,
    });
    await writeJson("villas.json", list);
    revalidateListing(copySlug);
    return { ok: true };
  });
}
