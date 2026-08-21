import type {
  JournalArticle,
  ContentBlock,
} from "@/lib/journal/types";
import { readJsonSync, readJson, writeJson } from "@/lib/storage";

const FILE = "journal-articles.json";

/* ------------------------------------------------------------------ *
 * Reading time — ~200 wpm over text blocks + 12s per image/gallery.
 * ------------------------------------------------------------------ */
export function estimateReadingTime(blocks: ContentBlock[]): number {
  let words = 0;
  let mediaSeconds = 0;
  for (const b of blocks) {
    switch (b.type) {
      case "paragraph":
      case "highlight":
      case "quote":
        words += (b.text ?? "").split(/\s+/).filter(Boolean).length;
        break;
      case "heading":
        words += (b.text ?? "").split(/\s+/).filter(Boolean).length;
        break;
      case "callout":
        words += (b.text ?? "").split(/\s+/).filter(Boolean).length;
        break;
      case "image":
        mediaSeconds += 12;
        break;
      case "gallery":
        mediaSeconds += 12 * (b.images?.length ?? 1);
        break;
      default:
        break;
    }
  }
  const minutes = words / 200 + mediaSeconds / 60;
  return Math.max(1, Math.round(minutes));
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

/** Every article regardless of status — admin only. */
export function getAllArticles(): JournalArticle[] {
  return readJsonSync<JournalArticle[]>(FILE, []);
}

/** Published articles whose publish time has arrived, newest first. */
export function getPublishedArticles(): JournalArticle[] {
  const now = Date.now();
  return getAllArticles()
    .filter(
      (a) =>
        a.status === "published" &&
        (!a.publishedAt || new Date(a.publishedAt).getTime() <= now),
    )
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
    );
}

export function getArticleBySlug(slug: string): JournalArticle | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}

export function getPublishedArticleBySlug(
  slug: string,
): JournalArticle | undefined {
  return getPublishedArticles().find((a) => a.slug === slug);
}

/** Resolve a slug that may be an OLD slug → the article that now owns it,
 *  so the route can 301 to the canonical URL. */
export function getArticleByPreviousSlug(
  slug: string,
): JournalArticle | undefined {
  return getPublishedArticles().find((a) =>
    (a.previousSlugs ?? []).includes(slug),
  );
}

export function getArticleById(id: string): JournalArticle | undefined {
  return getAllArticles().find((a) => a.id === id);
}

export function getArticlesByCategory(categorySlug: string): JournalArticle[] {
  return getPublishedArticles().filter((a) => a.categorySlug === categorySlug);
}

export function getArticlesByDestination(destinationSlug: string): JournalArticle[] {
  return getPublishedArticles().filter(
    (a) => a.destinationSlug === destinationSlug,
  );
}

export function getArticlesByTag(tagSlug: string): JournalArticle[] {
  return getPublishedArticles().filter((a) => a.tags.includes(tagSlug));
}

export function getEditorsPicks(max = 4): JournalArticle[] {
  return getPublishedArticles()
    .filter((a) => typeof a.editorsPickRank === "number")
    .sort((a, b) => (a.editorsPickRank ?? 99) - (b.editorsPickRank ?? 99))
    .slice(0, max);
}

/** Latest stories, optionally excluding editor's picks / filtered by category. */
export function getLatestArticles(opts: {
  count?: number;
  categorySlug?: string;
  excludePicks?: boolean;
  excludeSlug?: string;
} = {}): JournalArticle[] {
  const { count = 6, categorySlug, excludePicks, excludeSlug } = opts;
  let list = getPublishedArticles();
  if (categorySlug) list = list.filter((a) => a.categorySlug === categorySlug);
  if (excludePicks) list = list.filter((a) => a.editorsPickRank === undefined);
  if (excludeSlug) list = list.filter((a) => a.slug !== excludeSlug);
  return list.slice(0, count);
}

export type ArticleSort = "newest" | "oldest" | "popular";

export function searchArticles(opts: {
  q?: string;
  categorySlug?: string;
  destinationSlug?: string;
  tag?: string;
  sort?: ArticleSort;
} = {}): JournalArticle[] {
  const { q, categorySlug, destinationSlug, tag, sort = "newest" } = opts;
  let list = getPublishedArticles();

  if (categorySlug) list = list.filter((a) => a.categorySlug === categorySlug);
  if (destinationSlug)
    list = list.filter((a) => a.destinationSlug === destinationSlug);
  if (tag) list = list.filter((a) => a.tags.includes(tag));

  if (q) {
    const needle = q.toLowerCase().trim();
    list = list.filter((a) => {
      const haystack = [
        a.title,
        a.subtitle,
        a.excerpt,
        a.categorySlug,
        a.destinationSlug,
        ...a.tags,
        ...a.blocks
          .map((b) =>
            "text" in b ? (b as { text?: string }).text : undefined,
          )
          .filter(Boolean),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }

  switch (sort) {
    case "oldest":
      list.sort((a, b) =>
        (a.publishedAt ?? a.createdAt).localeCompare(b.publishedAt ?? b.createdAt),
      );
      break;
    case "popular":
      list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
      break;
    default:
      break; // getPublishedArticles is already newest-first
  }
  return list;
}

/** "Keep exploring": explicit overrides first, then same destination,
 *  same category, shared tags, then newest fill. */
export function getRelatedArticles(
  article: JournalArticle,
  limit = 3,
): JournalArticle[] {
  const pool = getPublishedArticles().filter((a) => a.slug !== article.slug);
  const picked: JournalArticle[] = [];
  const seen = new Set<string>();
  const add = (a?: JournalArticle) => {
    if (!a || seen.has(a.slug) || picked.length >= limit) return;
    seen.add(a.slug);
    picked.push(a);
  };

  for (const slug of article.relatedArticleSlugs ?? [])
    add(pool.find((a) => a.slug === slug));
  if (article.destinationSlug)
    for (const a of pool)
      if (a.destinationSlug === article.destinationSlug) add(a);
  for (const a of pool) if (a.categorySlug === article.categorySlug) add(a);
  for (const a of pool)
    if (a.tags.some((t) => article.tags.includes(t))) add(a);
  for (const a of pool) add(a);

  return picked.slice(0, limit);
}

export function articleHref(a: Pick<JournalArticle, "slug">): string {
  return `/journal/${a.slug}`;
}

/* ------------------------------------------------------------------ *
 * Writes (admin server actions)
 * ------------------------------------------------------------------ */

export async function readArticles(): Promise<JournalArticle[]> {
  return readJson<JournalArticle[]>(FILE, []);
}

export async function saveArticles(list: JournalArticle[]): Promise<void> {
  await writeJson(FILE, list);
}
