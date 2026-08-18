import fs from "fs";
import path from "path";
import type { MetadataRoute } from "next";
import { getVillas } from "@/lib/data/villas";
import { propertyPath } from "@/lib/property-url";
import { destinations } from "@/lib/data/locations";
import { collections } from "@/lib/data/collections";
import {
  getPublishedExperiences,
  getExperienceCities,
  experienceHref,
} from "@/lib/data/experiences";

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
    { url: `${SITE}/hotels`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/hostels`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/locations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/collections`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/experiences`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/partner`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

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

  return [
    ...staticPages,
    ...villaPages,
    ...statePages,
    ...cityPages,
    ...colPages,
    ...expCityPages,
    ...expPages,
  ];
}
