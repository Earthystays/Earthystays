import type { JournalCategory } from "@/lib/journal/types";
import { readJsonSync, readJson, writeJson } from "@/lib/storage";

const FILE = "journal-categories.json";

/** Ships with the spec's default categories the first time the store is
 *  empty. Once the admin edits the set it is persisted and this is ignored. */
const SEED: JournalCategory[] = [
  { slug: "goa", name: "Goa", order: 0, enabled: true, description: "Stories, guides and secrets from every corner of Goa." },
  { slug: "travel-guides", name: "Travel Guides", order: 1, enabled: true, description: "Practical, local-first guides to travelling well." },
  { slug: "villa-guides", name: "Villa Guides", order: 2, enabled: true, description: "How to choose the right stay for your trip." },
  { slug: "experiences", name: "Experiences", order: 3, enabled: true, description: "Things worth doing, from sunrise yoga to river cruises." },
  { slug: "food-and-drink", name: "Food & Drink", order: 4, enabled: true, description: "Where to eat, drink and linger." },
  { slug: "weekend-getaways", name: "Weekend Getaways", order: 5, enabled: true, description: "Short trips, beautiful drives, easy escapes." },
  { slug: "travel-tips", name: "Travel Tips", order: 6, enabled: true, description: "The little things that make a trip effortless." },
  { slug: "earthy-stories", name: "Earthy Stories", order: 7, enabled: true, description: "Guest stories, happy memories and moments." },
];

export function getAllCategories(): JournalCategory[] {
  const stored = readJsonSync<JournalCategory[]>(FILE, []);
  const list = stored.length ? stored : SEED;
  return [...list].sort((a, b) => a.order - b.order);
}

export function getEnabledCategories(): JournalCategory[] {
  return getAllCategories().filter((c) => c.enabled);
}

export function getCategoryBySlug(slug: string): JournalCategory | undefined {
  return getAllCategories().find((c) => c.slug === slug);
}

export async function readCategories(): Promise<JournalCategory[]> {
  const stored = await readJson<JournalCategory[]>(FILE, []);
  return stored.length ? stored : SEED;
}

export async function saveCategories(list: JournalCategory[]): Promise<void> {
  await writeJson(FILE, list);
}
