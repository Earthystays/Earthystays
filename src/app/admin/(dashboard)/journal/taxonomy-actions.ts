"use server";

import { revalidatePath } from "next/cache";
import type {
  JournalCategory,
  JournalDestination,
  JournalAuthor,
} from "@/lib/journal/types";
import { readCategories, saveCategories } from "@/lib/data/journal-categories";
import {
  readJournalDestinations,
  saveJournalDestinations,
} from "@/lib/data/journal-destinations";
import { readAuthors, saveAuthors } from "@/lib/data/journal-authors";
import { slugify } from "@/lib/slug";
import crypto from "crypto";

function revalidateJournal() {
  revalidatePath("/journal");
  revalidatePath("/admin/journal");
}

/* ─────────────────────────── Categories ─────────────────────────── */

export async function saveCategoryList(
  list: JournalCategory[],
): Promise<{ ok: boolean; error?: string }> {
  const seen = new Set<string>();
  const normalized = list.map((c, i) => {
    const slug = slugify(c.slug || c.name);
    if (seen.has(slug)) throw new Error(`Duplicate category slug: ${slug}`);
    seen.add(slug);
    return { ...c, slug, order: i };
  });
  await saveCategories(normalized);
  revalidatePath("/admin/journal/categories");
  revalidateJournal();
  return { ok: true };
}

export async function addCategory(name: string): Promise<{ ok: boolean; error?: string }> {
  if (name.trim().length < 2) return { ok: false, error: "Name is required." };
  const list = await readCategories();
  const slug = slugify(name);
  if (list.some((c) => c.slug === slug)) return { ok: false, error: "That category already exists." };
  list.push({ slug, name: name.trim(), order: list.length, enabled: true });
  await saveCategories(list);
  revalidatePath("/admin/journal/categories");
  revalidateJournal();
  return { ok: true };
}

/* ─────────────────────────── Destinations ────────────────────────── */

export async function saveDestinationList(
  list: JournalDestination[],
): Promise<{ ok: boolean }> {
  const normalized = list.map((d, i) => ({
    ...d,
    slug: slugify(d.slug || d.name),
    order: i,
  }));
  await saveJournalDestinations(normalized);
  revalidatePath("/admin/journal/destinations");
  revalidateJournal();
  return { ok: true };
}

export async function addDestination(name: string): Promise<{ ok: boolean; error?: string }> {
  if (name.trim().length < 2) return { ok: false, error: "Name is required." };
  const list = await readJournalDestinations();
  const slug = slugify(name);
  if (list.some((d) => d.slug === slug)) return { ok: false, error: "That destination already exists." };
  list.push({ slug, name: name.trim(), order: list.length, enabled: true });
  await saveJournalDestinations(list);
  revalidatePath("/admin/journal/destinations");
  revalidateJournal();
  return { ok: true };
}

/* ──────────────────────────── Authors ─────────────────────────────── */

export async function saveAuthorList(list: JournalAuthor[]): Promise<{ ok: boolean }> {
  const normalized = list.map((a) => ({
    ...a,
    id: a.id || `au-${crypto.randomBytes(4).toString("hex")}`,
    slug: slugify(a.slug || a.name),
  }));
  await saveAuthors(normalized);
  revalidatePath("/admin/journal/authors");
  revalidateJournal();
  return { ok: true };
}

export async function addAuthor(name: string): Promise<{ ok: boolean; error?: string }> {
  if (name.trim().length < 2) return { ok: false, error: "Name is required." };
  const list = await readAuthors();
  list.push({
    id: `au-${crypto.randomBytes(4).toString("hex")}`,
    slug: slugify(name),
    name: name.trim(),
  });
  await saveAuthors(list);
  revalidatePath("/admin/journal/authors");
  revalidateJournal();
  return { ok: true };
}
