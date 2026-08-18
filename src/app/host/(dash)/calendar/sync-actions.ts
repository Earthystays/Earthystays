"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getVillasByHost } from "@/lib/data/villas";
import {
  addIcalImport,
  isSafeIcalUrl,
  removeIcalImport,
  syncIcalImports,
  type IcalConfig,
} from "@/lib/data/ical";

type Result = { ok: boolean; error?: string; config?: IcalConfig };

async function requireOwnListing(slug: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user?.isHost) return { error: "Not signed in as a host" };
  if (!getVillasByHost(user.id).some((v) => v.slug === slug)) {
    return { error: "Listing not found in your account" };
  }
  return {};
}

export async function addCalendarImport(
  slug: string,
  name: string,
  url: string,
): Promise<Result> {
  const gate = await requireOwnListing(slug);
  if (gate.error) return { ok: false, error: gate.error };

  if (name.trim().length < 2) return { ok: false, error: "Give the calendar a name, e.g. Airbnb" };
  if (!isSafeIcalUrl(url)) {
    return { ok: false, error: "Paste the full https:// iCal link from the other platform" };
  }

  await addIcalImport(slug, name, url);
  // Pull it immediately so the host sees dates (and errors) right away.
  const config = await syncIcalImports(slug);
  revalidatePath("/host/calendar");
  return { ok: true, config };
}

export async function removeCalendarImport(slug: string, importId: string): Promise<Result> {
  const gate = await requireOwnListing(slug);
  if (gate.error) return { ok: false, error: gate.error };
  await removeIcalImport(slug, importId);
  revalidatePath("/host/calendar");
  return { ok: true };
}

export async function syncCalendarsNow(slug: string): Promise<Result> {
  const gate = await requireOwnListing(slug);
  if (gate.error) return { ok: false, error: gate.error };
  const config = await syncIcalImports(slug);
  revalidatePath("/host/calendar");
  return { ok: true, config };
}
