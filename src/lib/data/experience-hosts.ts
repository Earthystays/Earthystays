import type { ExperienceHost } from "@/lib/types";
import { readJsonSync, readJson, writeJson } from "@/lib/storage";

const FILE = "experience-hosts.json";

export function getHosts(): ExperienceHost[] {
  return readJsonSync<ExperienceHost[]>(FILE, []);
}

export function getHostById(id: string | undefined): ExperienceHost | undefined {
  if (!id) return undefined;
  return getHosts().find((h) => h.id === id);
}

export async function readHosts(): Promise<ExperienceHost[]> {
  return readJson<ExperienceHost[]>(FILE, []);
}

export async function saveHosts(list: ExperienceHost[]): Promise<void> {
  await writeJson(FILE, list);
}

export function newHostId(): string {
  return `host_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
