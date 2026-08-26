/**
 * Cross-links between stays, experiences, collections, destinations and the
 * journal.
 *
 * One shared relevance rule so a property→experience link and the reverse
 * experience→property link agree with each other, rather than each page
 * inventing its own matching logic.
 *
 * Everything here returns [] when there is nothing genuinely relevant. Callers
 * render no section at all in that case — an empty "Where to stay" heading is
 * worse than none.
 */
import type { Experience, Villa } from "@/lib/types";
import { getPublishedExperiences } from "@/lib/data/experiences";
import { getVillas, getVillasByCollection } from "@/lib/data/villas";
import { getPublishedArticles } from "@/lib/data/journal";
import { getEnabledJournalDestinations } from "@/lib/data/journal-destinations";
import type { JournalArticle } from "@/lib/journal/types";

/** Case-insensitive compare that treats missing values as non-matching. */
function sameText(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Does this property sit in the same place as this experience?
 *
 * Experiences are catalogued at destination level (`citySlug` is typically the
 * state slug, e.g. "goa"), so destination is the primary key; town and state
 * names are accepted as secondary matches.
 */
function sharesPlace(villa: Villa, exp: Experience): boolean {
  if (exp.citySlug && villa.destinationSlug === exp.citySlug) return true;
  if (sameText(villa.state, exp.state)) return true;
  if (sameText(villa.city, exp.city)) return true;
  return false;
}

/* ─────────────────── experience → stays ─────────────────── */

/**
 * "Where to stay" — properties near an experience.
 *
 * Ordered by how specific the match is: same town first, then same
 * destination, so a guest sees the closest options at the top.
 */
export function staysForExperience(exp: Experience, limit = 3): Villa[] {
  const candidates = getVillas().filter((v) => sharesPlace(v, exp));

  return candidates
    .map((v) => ({
      villa: v,
      // Lower score sorts first.
      score:
        sameText(v.city, exp.city) ? 0 : v.destinationSlug === exp.citySlug ? 1 : 2,
    }))
    .sort(
      (a, b) =>
        a.score - b.score ||
        (b.villa.featured ? 1 : 0) - (a.villa.featured ? 1 : 0) ||
        b.villa.rating - a.villa.rating,
    )
    .slice(0, limit)
    .map((x) => x.villa);
}

/* ─────────────────── collection → everything ─────────────────── */

/** Destinations a collection actually has inventory in, with counts. */
export function destinationsForCollection(
  collectionSlug: string,
): { slug: string; name: string; count: number }[] {
  const villas = getVillasByCollection(collectionSlug);
  const map = new Map<string, { slug: string; name: string; count: number }>();

  for (const v of villas) {
    const slug = v.destinationSlug;
    if (!slug) continue;
    const existing = map.get(slug);
    if (existing) existing.count += 1;
    else map.set(slug, { slug, name: v.state ?? slug, count: 1 });
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Experiences in the destinations a collection covers. */
export function experiencesForCollection(
  collectionSlug: string,
  limit = 4,
): Experience[] {
  const destinationSlugs = new Set(
    destinationsForCollection(collectionSlug).map((d) => d.slug),
  );
  if (destinationSlugs.size === 0) return [];

  return getPublishedExperiences()
    .filter((e) => e.citySlug && destinationSlugs.has(e.citySlug))
    .sort(
      (a, b) =>
        (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
        (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99),
    )
    .slice(0, limit);
}

/* ─────────────────── journal linkage ─────────────────── */

/**
 * Journal articles for a destination.
 *
 * Articles carry town-level `destinationSlug`s (anjuna, assagao…). Journal
 * destinations carry a `location` such as "North Goa", which is the only link
 * back up to a state — so that string is what we match on.
 */
export function journalForStateName(
  stateName: string,
  limit = 3,
): JournalArticle[] {
  const townSlugs = new Set(
    getEnabledJournalDestinations()
      .filter((d) => d.location?.toLowerCase().includes(stateName.toLowerCase()))
      .map((d) => d.slug),
  );
  if (townSlugs.size === 0) return [];

  return getPublishedArticles()
    .filter((a) => a.destinationSlug && townSlugs.has(a.destinationSlug))
    .slice(0, limit);
}

/** Journal guides relevant to a collection, via the destinations it covers. */
export function journalForCollection(
  collectionSlug: string,
  limit = 3,
): JournalArticle[] {
  const names = destinationsForCollection(collectionSlug).map((d) => d.name);
  const seen = new Set<string>();
  const out: JournalArticle[] = [];

  for (const name of names) {
    for (const article of journalForStateName(name, limit)) {
      if (seen.has(article.id)) continue;
      seen.add(article.id);
      out.push(article);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/* ─────────────────── collection quality ─────────────────── */

/** Below this a collection page is too thin to be worth indexing. */
export const MIN_COLLECTION_INVENTORY = 3;

/**
 * Should search engines index this collection?
 *
 * Collections with almost no inventory are still reachable and still work for
 * a visitor — they are simply marked `noindex` so the site doesn't accumulate
 * thin pages competing with its real ones.
 */
export function isCollectionIndexable(collectionSlug: string): boolean {
  return getVillasByCollection(collectionSlug).length >= MIN_COLLECTION_INVENTORY;
}
