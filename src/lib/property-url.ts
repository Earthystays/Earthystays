import type { Villa } from "@/lib/types";

/**
 * Canonical path for a property (Phase I). Hotels and hostels get their own
 * SEO routes; villas & apartments keep the original /villas/[slug] URL so no
 * existing link or bookmark breaks.
 *
 *   villa / apartment → /villas/{slug}
 *   hotel             → /hotels/{destinationSlug}/{slug}
 *   hostel            → /hostels/{destinationSlug}/{slug}
 */
export function propertyPath(
  villa: Pick<Villa, "slug" | "type" | "destinationSlug">,
): string {
  if (villa.type === "hotel") return `/hotels/${villa.destinationSlug}/${villa.slug}`;
  if (villa.type === "hostel") return `/hostels/${villa.destinationSlug}/${villa.slug}`;
  return `/villas/${villa.slug}`;
}

/** Absolute canonical URL (for JSON-LD, OpenGraph, sitemap). */
export function propertyUrl(
  villa: Pick<Villa, "slug" | "type" | "destinationSlug">,
  origin = "https://earthystays.com",
): string {
  return `${origin}${propertyPath(villa)}`;
}
