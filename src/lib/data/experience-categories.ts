import type { ExperienceCategory } from "@/lib/types";
import { readJsonSync, readJson, writeJson } from "@/lib/storage";

const FILE = "experience-categories.json";

/** Seeded fallback — used when the JSON store is empty. Admin can add,
 *  rename, or remove categories; icons are lucide-react names. */
const SEED: ExperienceCategory[] = [
  { slug: "food", name: "Food", icon: "UtensilsCrossed" },
  { slug: "adventure", name: "Adventure", icon: "Mountain" },
  { slug: "wellness", name: "Wellness", icon: "Flower2" },
  { slug: "photography", name: "Photography", icon: "Camera" },
  { slug: "nature", name: "Nature", icon: "Trees" },
  { slug: "cycling", name: "Cycling", icon: "Bike" },
  { slug: "workshop", name: "Workshop", icon: "Hammer" },
  { slug: "cooking", name: "Cooking", icon: "ChefHat" },
  { slug: "culture", name: "Local Culture", icon: "Landmark" },
  { slug: "water-sports", name: "Water Sports", icon: "Waves" },
  { slug: "camping", name: "Camping", icon: "Tent" },
  { slug: "wildlife", name: "Wildlife", icon: "Bird" },
  { slug: "kids", name: "Kids", icon: "Baby" },
  { slug: "luxury", name: "Luxury", icon: "Gem" },
  { slug: "hidden-gems", name: "Hidden Gems", icon: "Sparkles" },
];

export function getCategories(): ExperienceCategory[] {
  const stored = readJsonSync<ExperienceCategory[]>(FILE, []);
  return stored.length > 0 ? stored : SEED;
}

export function getCategoryBySlug(slug: string): ExperienceCategory | undefined {
  return getCategories().find((c) => c.slug === slug);
}

export async function readCategories(): Promise<ExperienceCategory[]> {
  const stored = await readJson<ExperienceCategory[]>(FILE, []);
  return stored.length > 0 ? stored : SEED;
}

export async function saveCategories(list: ExperienceCategory[]): Promise<void> {
  await writeJson(FILE, list);
}
