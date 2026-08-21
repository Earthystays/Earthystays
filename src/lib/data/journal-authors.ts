import type { JournalAuthor } from "@/lib/journal/types";
import { readJsonSync, readJson, writeJson } from "@/lib/storage";

const FILE = "journal-authors.json";

const SEED: JournalAuthor[] = [
  {
    id: "earthy-editors",
    slug: "earthy-editors",
    name: "The Earthy Editors",
    role: "Curated by the locals",
    bio: "The team behind Earthy Stays — writing about the places, stays and experiences we love across Goa and beyond.",
  },
];

export function getAllAuthors(): JournalAuthor[] {
  const stored = readJsonSync<JournalAuthor[]>(FILE, []);
  return stored.length ? stored : SEED;
}

export function getAuthorById(id: string): JournalAuthor | undefined {
  return getAllAuthors().find((a) => a.id === id);
}

export function getAuthorBySlug(slug: string): JournalAuthor | undefined {
  return getAllAuthors().find((a) => a.slug === slug);
}

export async function readAuthors(): Promise<JournalAuthor[]> {
  const stored = await readJson<JournalAuthor[]>(FILE, []);
  return stored.length ? stored : SEED;
}

export async function saveAuthors(list: JournalAuthor[]): Promise<void> {
  await writeJson(FILE, list);
}
