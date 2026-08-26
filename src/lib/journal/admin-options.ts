import { getVillas } from "@/lib/data/villas";
import { getPublishedExperiences } from "@/lib/data/experiences";
import { getEnabledJournalDestinations } from "@/lib/data/journal-destinations";
import { getAllArticles } from "@/lib/data/journal";
import { getAllCollections } from "@/lib/data/collections";
import type { EntityOption } from "@/components/journal/admin/entity-picker";
import type { BlockEditorOptions } from "@/components/journal/admin/block-editor";

/** Article slug options for campaign / related-article pickers. */
export function getArticleOptions(): EntityOption[] {
  return getAllArticles().map((a) => ({
    slug: a.slug,
    name: a.title || "Untitled",
    meta: a.status,
  }));
}

/** Slim option lists for the block editor's embed pickers — resolved live
 *  from the central stores so the CMS never hand-copies property data. */
export function getBlockEditorOptions(): BlockEditorOptions {
  const properties: EntityOption[] = getVillas().map((v) => ({
    slug: v.slug,
    name: v.name,
    meta: v.city || v.destinationSlug,
  }));
  const experiences: EntityOption[] = getPublishedExperiences().map((e) => ({
    slug: e.slug,
    name: e.name,
    meta: e.city || e.citySlug,
  }));
  const destinations: EntityOption[] = getEnabledJournalDestinations().map((d) => ({
    slug: d.slug,
    name: d.name,
    meta: d.location,
  }));
  const collections: EntityOption[] = getAllCollections().map((c) => ({
    slug: c.slug,
    name: c.name,
    meta: c.blurb?.slice(0, 40),
  }));
  return { properties, experiences, destinations, collections };
}
