import type { JournalDestination } from "@/lib/journal/types";
import { readJsonSync, readJson, writeJson } from "@/lib/storage";

const FILE = "journal-destinations.json";

/** Seeded with the Goa localities from the design. Admin-editable thereafter. */
const SEED: JournalDestination[] = [
  { slug: "morjim", name: "Morjim", location: "North Goa", order: 0, enabled: true, description: "Turtle beaches, river mouths and long, quiet sands." },
  { slug: "assagao", name: "Assagao", location: "North Goa", order: 1, enabled: true, description: "The village of flowers — leafy lanes and design cafes." },
  { slug: "anjuna", name: "Anjuna", location: "North Goa", order: 2, enabled: true, description: "Cliffs, flea markets and legendary sunsets." },
  { slug: "vagator", name: "Vagator", location: "North Goa", order: 3, enabled: true, description: "Red cliffs, twin beaches and hilltop views." },
  { slug: "siolim", name: "Siolim", location: "North Goa", order: 4, enabled: true, description: "Riverside calm at the gateway to the north." },
  { slug: "panaji", name: "Panaji", location: "Central Goa", order: 5, enabled: true, description: "Latin quarters, heritage streets and river promenades." },
];

export function getAllJournalDestinations(): JournalDestination[] {
  const stored = readJsonSync<JournalDestination[]>(FILE, []);
  const list = stored.length ? stored : SEED;
  return [...list].sort((a, b) => a.order - b.order);
}

export function getEnabledJournalDestinations(): JournalDestination[] {
  return getAllJournalDestinations().filter((d) => d.enabled);
}

export function getJournalDestinationBySlug(
  slug: string,
): JournalDestination | undefined {
  return getAllJournalDestinations().find((d) => d.slug === slug);
}

export async function readJournalDestinations(): Promise<JournalDestination[]> {
  const stored = await readJson<JournalDestination[]>(FILE, []);
  return stored.length ? stored : SEED;
}

export async function saveJournalDestinations(
  list: JournalDestination[],
): Promise<void> {
  await writeJson(FILE, list);
}
