"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import type { Villa } from "@/lib/types";
import { getVillaBySlugWithHidden } from "@/lib/data/villas";
import { findUserByEmail, makeHost } from "@/lib/data/users";
import { notifyHostOfListingAccess } from "@/lib/notify";

type Result = { ok: true; hostName: string; hostEmail: string } | { ok: false; error: string };

/**
 * Hand a listing to a host, looked up by their account email. Works for
 * admin-created listings (no hostId) and for reassignment. Seed villas get
 * a full override entry written to villas.json — same mechanism admin
 * edits use.
 */
export async function assignHostAction(slug: string, email: string): Promise<Result> {
  const villa = getVillaBySlugWithHidden(slug);
  if (!villa) return { ok: false, error: "Listing not found." };

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "Enter the host's email." };

  const user = await findUserByEmail(trimmed);
  if (!user) {
    return {
      ok: false,
      error: `No Earthy Stays account uses ${trimmed}. Ask them to sign up on the site first, then assign again.`,
    };
  }

  // Unlock /host for them if this is their first listing.
  await makeHost(user.id);

  const list = await readJson<Villa[]>("villas.json", []);
  const idx = list.findIndex((v) => v.slug === slug);
  const updated: Villa = { ...(idx >= 0 ? list[idx] : villa), hostId: user.id };
  if (idx >= 0) list[idx] = updated;
  else list.push(updated);
  await writeJson("villas.json", list);

  // Fire-and-forget email (env-gated, same contract as other notifications).
  await notifyHostOfListingAccess(updated, user);

  revalidatePath("/admin/villas");
  return { ok: true, hostName: user.name, hostEmail: user.email };
}

/** Take a listing back in-house — clears hostId, keeps everything else. */
export async function removeHostAction(slug: string): Promise<Result> {
  const villa = getVillaBySlugWithHidden(slug);
  if (!villa) return { ok: false, error: "Listing not found." };

  const list = await readJson<Villa[]>("villas.json", []);
  const idx = list.findIndex((v) => v.slug === slug);
  const updated: Villa = { ...(idx >= 0 ? list[idx] : villa), hostId: undefined };
  if (idx >= 0) list[idx] = updated;
  else list.push(updated);
  await writeJson("villas.json", list);

  revalidatePath("/admin/villas");
  return { ok: true, hostName: "", hostEmail: "" };
}
