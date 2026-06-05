import type { MetadataRoute } from "next";
import { getVillas } from "@/lib/data/villas";
import { destinations } from "@/lib/data/locations";
import { collections } from "@/lib/data/collections";

const SITE = "https://earthystays.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = ["", "/villas", "/locations", "/collections", "/about", "/partner"].map(
    (p) => ({ url: `${SITE}${p}`, lastModified: now }),
  );
  const villaPages = getVillas().map((v) => ({
    url: `${SITE}/villas/${v.slug}`,
    lastModified: now,
  }));
  const statePages = destinations.map((d) => ({
    url: `${SITE}/locations/${d.slug}`,
    lastModified: now,
  }));
  const cityPages = destinations.flatMap((d) =>
    d.cities.map((c) => ({
      url: `${SITE}/locations/${d.slug}/${c.slug}`,
      lastModified: now,
    })),
  );
  const colPages = collections.map((c) => ({
    url: `${SITE}/collections/${c.slug}`,
    lastModified: now,
  }));
  return [...staticPages, ...villaPages, ...statePages, ...cityPages, ...colPages];
}
