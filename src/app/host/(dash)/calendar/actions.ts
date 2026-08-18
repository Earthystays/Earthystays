"use server";

import { getCurrentUser } from "@/lib/session";
import { getVillasByHost } from "@/lib/data/villas";
import { toggleBlockedDate } from "@/lib/data/blocked-dates";

export async function toggleDate(
  slug: string,
  date: string,
): Promise<{ ok: boolean; blocked?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user?.isHost) return { ok: false, error: "Not signed in as a host" };
  if (!getVillasByHost(user.id).some((v) => v.slug === slug)) {
    return { ok: false, error: "Listing not found in your account" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Invalid date" };
  }
  const { blocked } = await toggleBlockedDate(slug, date);
  return { ok: true, blocked };
}
