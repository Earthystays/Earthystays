import { readJsonSync } from "@/lib/storage";

/**
 * Per-location cover image overrides. Stored in data/location-covers.json as:
 *   { "goa": "/uploads/...", "goa/north-goa": "/uploads/..." }
 *
 * Used by the locations index, state pages, and city pages to display
 * admin-uploaded cover photos that override the seed images.
 */
export type LocationCovers = Record<string, string>;

export function getLocationCovers(): LocationCovers {
  return readJsonSync<LocationCovers>("location-covers.json", {});
}

export function getStateCover(stateSlug: string): string | undefined {
  return getLocationCovers()[stateSlug];
}

export function getCityCover(stateSlug: string, citySlug: string): string | undefined {
  return getLocationCovers()[`${stateSlug}/${citySlug}`];
}
