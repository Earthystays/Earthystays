import type { JournalCampaign } from "@/lib/journal/types";
import { readJsonSync, readJson, writeJson } from "@/lib/storage";

const FILE = "journal-campaigns.json";

export function getAllCampaigns(): JournalCampaign[] {
  return readJsonSync<JournalCampaign[]>(FILE, []);
}

/** The campaign to surface right now: enabled and within its date window.
 *  If several qualify, the one ending soonest wins (most time-sensitive). */
export function getActiveCampaign(): JournalCampaign | undefined {
  const now = Date.now();
  const active = getAllCampaigns().filter((c) => {
    if (!c.enabled) return false;
    if (c.startsAt && new Date(c.startsAt).getTime() > now) return false;
    if (c.endsAt && new Date(c.endsAt).getTime() < now) return false;
    return true;
  });
  return active.sort((a, b) => {
    const ea = a.endsAt ? new Date(a.endsAt).getTime() : Infinity;
    const eb = b.endsAt ? new Date(b.endsAt).getTime() : Infinity;
    return ea - eb;
  })[0];
}

export function getCampaignBySlug(slug: string): JournalCampaign | undefined {
  return getAllCampaigns().find((c) => c.slug === slug);
}

export async function readCampaigns(): Promise<JournalCampaign[]> {
  return readJson<JournalCampaign[]>(FILE, []);
}

export async function saveCampaigns(list: JournalCampaign[]): Promise<void> {
  await writeJson(FILE, list);
}
