import type { Villa } from "@/lib/types";
import { VILLA_AMENITIES, VILLA_FACILITIES } from "./new/constants";
import type { AddVillaValues } from "./new/actions";

/**
 * Convert a saved Villa into the shape the admin form expects so we can
 * pre-fill the form for editing.
 *
 * Preset amenities/facilities go into the checkbox arrays; anything
 * that isn't a preset goes into the "custom" textareas (comma-separated).
 */
export function villaToFormValues(
  villa: Villa,
  customAmenities: string[] = [],
  customFacilities: string[] = [],
): AddVillaValues {
  const amenityPresets = new Set<string>([...VILLA_AMENITIES, ...customAmenities]);
  const facilityPresets = new Set<string>([...VILLA_FACILITIES, ...customFacilities]);

  const amenitiesChecked = villa.amenities.filter((a) => amenityPresets.has(a));
  const amenitiesCustom = villa.amenities.filter((a) => !amenityPresets.has(a));

  const facilities = villa.facilities ?? [];
  const facilitiesChecked = facilities.filter((f) => facilityPresets.has(f));
  const facilitiesCustom = facilities.filter((f) => !facilityPresets.has(f));

  return {
    slug: villa.slug,
    propertyType: villa.type ?? "villa",
    name: villa.name,
    tagline: villa.tagline,
    description: villa.description,
    destinationSlug: villa.destinationSlug,
    collections: villa.collections,
    bedrooms: String(villa.bedrooms),
    bathrooms: String(villa.bathrooms),
    maxGuests: String(villa.maxGuests),
    pricePerNight: String(villa.pricePerNight),
    rating: String(villa.rating),
    reviewCount: String(villa.reviewCount),
    amenities: amenitiesChecked,
    customAmenities: amenitiesCustom.join(", "),
    facilities: facilitiesChecked,
    customFacilities: facilitiesCustom.join(", "),
    highlights: villa.highlights.join("\n"),
    houseRules: villa.houseRules.join("\n"),
    locationNote: villa.locationNote,
    state: villa.state ?? "",
    city: villa.city ?? "",
    latitude: villa.latitude !== undefined ? String(villa.latitude) : "",
    longitude: villa.longitude !== undefined ? String(villa.longitude) : "",
    cancellationPreset: villa.cancellationPolicy?.preset ?? "",
    cancellationDescription: villa.cancellationPolicy?.description ?? "",
    videoSrc:
      villa.video?.kind === "youtube"
        ? `https://www.youtube.com/watch?v=${villa.video.id}`
        : villa.video?.kind === "vimeo"
        ? `https://vimeo.com/${villa.video.id}`
        : villa.video?.kind === "file"
        ? villa.video.src ?? ""
        : "",
    faqs: villa.faqs ?? [],
    externalListings: villa.externalListings ?? [],
    featured: villa.featured ?? false,
    images: villa.images,
  };
}
