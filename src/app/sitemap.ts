import fs from "fs";
import path from "path";
import type { MetadataRoute } from "next";
import { getVillas, getHotels, getHostels } from "@/lib/data/villas";
import { propertyPath } from "@/lib/property-url";
import { destinations } from "@/lib/data/locations";
import { collections } from "@/lib/data/collections";
import {
  getPublishedExperiences,
  getExperienceCities,
  experienceHref,
} from "@/lib/data/experiences";
import { getPublishedArticles } from "@/lib/data/journal";
import { getEnabledCategories } from "@/lib/data/journal-categories";
import { getEnabledJournalDestinations } from "@/lib/data/journal-destinations";

const SITE = "https://earthystays.com";

/** villas.json has no per-record timestamp, so the file's own mtime is the
 *  best available signal for "villas last changed at". Falls back to now
 *  (e.g. first build, or file missing) rather than throwing. */
function villasLastModified(): Date {
  try {
    return fs.statSync(path.join(process.cwd(), "data", "villas.json")).mtime;
  } catch {
    return new Date();
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const villaLastModified = villasLastModified();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/villas`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    // Only advertise the hotels/hostels indexes once at least one is live.
    ...(getHotels().length > 0
      ? [{ url: `${SITE}/hotels`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 }]
      : []),
    ...(getHostels().length > 0
      ? [{ url: `${SITE}/hostels`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 }]
      : []),
    { url: `${SITE}/locations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/collections`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/experiences`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/partner`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  // Destination tiers (/hotels/goa, /hostels/goa) — only for destinations that
  // actually hold inventory, so we never advertise a page that 404s.
  const destinationTierPages: MetadataRoute.Sitemap = [
    ...new Set(getHotels().map((h) => `${SITE}/hotels/${h.destinationSlug}`)),
    ...new Set(getHostels().map((h) => `${SITE}/hostels/${h.destinationSlug}`)),
  ].map((url) => ({
    url,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const villaPages: MetadataRoute.Sitemap = getVillas().map((v) => ({
    // Hotels & hostels use their own canonical /hotels|/hostels URLs.
    url: `${SITE}${propertyPath(v)}`,
    lastModified: villaLastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const statePages: MetadataRoute.Sitemap = destinations.map((d) => ({
    url: `${SITE}/locations/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const cityPages: MetadataRoute.Sitemap = destinations.flatMap((d) =>
    d.cities.map((c) => ({
      url: `${SITE}/locations/${d.slug}/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  );

  const colPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${SITE}/collections/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const expCityPages: MetadataRoute.Sitemap = getExperienceCities().map((c) => ({
    url: `${SITE}/experiences/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const expPages: MetadataRoute.Sitemap = getPublishedExperiences().map((e) => ({
    url: `${SITE}${experienceHref(e)}`,
    lastModified: e.updatedAt ? new Date(e.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const journalStatic: MetadataRoute.Sitemap = [
    { url: `${SITE}/journal`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];

  const journalCategoryPages: MetadataRoute.Sitemap = getEnabledCategories().map((c) => ({
    url: `${SITE}/journal/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const journalDestPages: MetadataRoute.Sitemap = getEnabledJournalDestinations().map((d) => ({
    url: `${SITE}/journal/destination/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const journalArticlePages: MetadataRoute.Sitemap = getPublishedArticles().map((a) => ({
    url: `${SITE}/journal/${a.slug}`,
    lastModified: a.updatedAt ? new Date(a.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...destinationTierPages,
    ...villaPages,
    ...statePages,
    ...cityPages,
    ...colPages,
    ...expCityPages,
    ...expPages,
    ...journalStatic,
    ...journalCategoryPages,
    ...journalDestPages,
    ...journalArticlePages,
  ];
}
