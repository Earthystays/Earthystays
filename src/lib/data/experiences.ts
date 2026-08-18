import type { Experience } from "@/lib/types";
import { readJsonSync, readJson, writeJson } from "@/lib/storage";
import { getExperienceViewScoresSync } from "@/lib/data/experience-views";

const FILE = "experiences.json";

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

/** Every experience in the store, regardless of status. Used by the
 *  admin and by villa "Enhance Your Stay" slug resolution. */
export function getAllExperiences(): Experience[] {
  return readJsonSync<Experience[]>(FILE, []);
}

/** Public catalog — only published experiences. */
export function getPublishedExperiences(): Experience[] {
  return getAllExperiences().filter((e) => (e.status ?? "published") === "published");
}

export function getExperienceBySlug(slug: string): Experience | undefined {
  return getAllExperiences().find((e) => e.slug === slug);
}

/** Published experience by slug — used by the public detail page. */
export function getPublishedExperienceBySlug(slug: string): Experience | undefined {
  const e = getExperienceBySlug(slug);
  return e && (e.status ?? "published") === "published" ? e : undefined;
}

export function getExperiencesByCity(citySlug: string): Experience[] {
  return getPublishedExperiences().filter((e) => e.citySlug === citySlug);
}

/** Distinct cities that have at least one published experience. */
export function getExperienceCities(): { slug: string; name: string; count: number }[] {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const e of getPublishedExperiences()) {
    if (!e.citySlug) continue;
    const existing = map.get(e.citySlug);
    if (existing) existing.count += 1;
    else map.set(e.citySlug, { slug: e.citySlug, name: e.city ?? e.citySlug, count: 1 });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type ExperienceFilters = {
  city?: string;
  category?: string;
  language?: string;
  difficulty?: string;
  privateOnly?: boolean;
  maxPrice?: number;
  minGroup?: number;
  q?: string;
  sort?: "newest" | "popular" | "price-asc" | "price-desc" | "rating";
};

export function filterExperiences(
  filters: ExperienceFilters = {},
  base?: Experience[],
): Experience[] {
  let list = (base ?? getPublishedExperiences()).slice();
  const {
    city,
    category,
    language,
    difficulty,
    privateOnly,
    maxPrice,
    minGroup,
    q,
    sort,
  } = filters;

  if (city) list = list.filter((e) => e.citySlug === city);
  if (category) list = list.filter((e) => e.category === category);
  if (difficulty) list = list.filter((e) => e.difficulty === difficulty);
  if (privateOnly) list = list.filter((e) => e.privateAvailable);
  if (typeof maxPrice === "number")
    list = list.filter((e) => (e.priceFrom ?? 0) <= maxPrice);
  if (typeof minGroup === "number")
    list = list.filter((e) => (e.groupMax ?? Infinity) >= minGroup);
  if (language)
    list = list.filter((e) =>
      (e.languages ?? []).some((l) => l.toLowerCase() === language.toLowerCase()),
    );
  if (q) {
    const needle = q.toLowerCase().trim();
    list = list.filter((e) =>
      [e.name, e.blurb, e.city, e.overview, ...(e.tags ?? [])]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(needle)),
    );
  }

  switch (sort) {
    case "price-asc":
      list.sort((a, b) => (a.priceFrom ?? 0) - (b.priceFrom ?? 0));
      break;
    case "price-desc":
      list.sort((a, b) => (b.priceFrom ?? 0) - (a.priceFrom ?? 0));
      break;
    case "rating":
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "popular": {
      const scores = getExperienceViewScoresSync();
      list.sort((a, b) => (scores[b.slug] ?? 0) - (scores[a.slug] ?? 0));
      break;
    }
    case "newest":
    default:
      list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      break;
  }
  return list;
}

/** Related experiences: explicit relatedSlugs first, then same-city /
 *  same-category fill, excluding the current one. */
export function getRelated(exp: Experience, limit = 4): Experience[] {
  const published = getPublishedExperiences().filter((e) => e.slug !== exp.slug);
  const picked: Experience[] = [];
  const seen = new Set<string>();
  const add = (e: Experience) => {
    if (seen.has(e.slug) || picked.length >= limit) return;
    seen.add(e.slug);
    picked.push(e);
  };
  for (const slug of exp.relatedSlugs ?? []) {
    const e = published.find((x) => x.slug === slug);
    if (e) add(e);
  }
  for (const e of published) if (e.citySlug === exp.citySlug) add(e);
  for (const e of published) if (e.category === exp.category) add(e);
  for (const e of published) add(e);
  return picked.slice(0, limit);
}

/** Canonical URL for an experience: /experiences/{city}/{slug}. Falls
 *  back to a "goa" segment when the city slug is missing. */
export function experienceHref(exp: Pick<Experience, "slug" | "citySlug">): string {
  return `/experiences/${exp.citySlug || "goa"}/${exp.slug}`;
}

/* ------------------------------------------------------------------ *
 * Writes (used by admin server actions)
 * ------------------------------------------------------------------ */

export async function readExperiences(): Promise<Experience[]> {
  return readJson<Experience[]>(FILE, []);
}

export async function saveExperiences(list: Experience[]): Promise<void> {
  await writeJson(FILE, list);
}
