"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { JournalCampaign } from "@/lib/journal/types";
import { readCampaigns, saveCampaigns } from "@/lib/data/journal-campaigns";
import { slugify } from "@/lib/slug";

function revalidateCampaign() {
  revalidatePath("/journal");
  revalidatePath("/admin/journal/campaigns");
}

export async function saveCampaign(
  input: Omit<JournalCampaign, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<{ ok: boolean; error?: string; id?: string }> {
  await requireAdmin();
  if (!input.name?.trim()) return { ok: false, error: "Name is required." };
  if (!input.headline?.trim()) return { ok: false, error: "Headline is required." };

  const list = await readCampaigns();
  const now = new Date().toISOString();
  const existing = input.id ? list.find((c) => c.id === input.id) : undefined;
  const slug = slugify(input.slug || input.name);

  const campaign: JournalCampaign = {
    ...(existing ?? {}),
    ...input,
    id: existing?.id ?? `camp-${crypto.randomBytes(5).toString("hex")}`,
    slug,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const next = existing
    ? list.map((c) => (c.id === campaign.id ? campaign : c))
    : [campaign, ...list];
  await saveCampaigns(next);
  revalidateCampaign();
  return { ok: true, id: campaign.id };
}

export async function deleteCampaign(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const list = await readCampaigns();
  await saveCampaigns(list.filter((c) => c.id !== id));
  revalidateCampaign();
  return { ok: true };
}

export async function toggleCampaign(
  id: string,
  enabled: boolean,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const list = await readCampaigns();
  const c = list.find((x) => x.id === id);
  if (!c) return { ok: false };
  c.enabled = enabled;
  c.updatedAt = new Date().toISOString();
  await saveCampaigns(list);
  revalidateCampaign();
  return { ok: true };
}
