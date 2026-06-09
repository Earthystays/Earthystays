import type { Villa } from "@/lib/types";
import { getStateBySlug } from "@/lib/data/locations";

/**
 * LodgingBusiness JSON-LD for villa detail pages.
 *
 * Tells Google this URL is a specific accommodation with photos, location,
 * star rating, review count, and price. When Google parses this correctly,
 * the search result for the villa can show:
 *   - ⭐ star rating + review count next to the title
 *   - Price chip
 *   - Image carousel preview
 *   - Map / address row
 */
export function VillaJsonLd({ villa }: { villa: Villa }) {
  const state = getStateBySlug(villa.destinationSlug);
  const url = `https://earthystays.com/villas/${villa.slug}`;
  const images = villa.images
    .slice(0, 6)
    .map((img) =>
      img.src.startsWith("http") ? img.src : `https://earthystays.com${img.src}`,
    );

  const data = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": url,
    name: villa.name,
    description: villa.description || villa.tagline,
    url,
    image: images.length > 0 ? images : undefined,
    telephone: "+91-9657100004",
    address: {
      "@type": "PostalAddress",
      addressLocality: villa.city,
      addressRegion: state?.name,
      addressCountry: "IN",
    },
    geo:
      villa.latitude !== undefined && villa.longitude !== undefined
        ? {
            "@type": "GeoCoordinates",
            latitude: villa.latitude,
            longitude: villa.longitude,
          }
        : undefined,
    priceRange: villa.pricePerNight
      ? `₹${villa.pricePerNight.toLocaleString("en-IN")}`
      : undefined,
    aggregateRating:
      villa.rating > 0 && villa.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: villa.rating.toFixed(1),
            reviewCount: villa.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    numberOfRooms: villa.bedrooms,
    petsAllowed: villa.amenities.some((a) => /pet/i.test(a)),
    amenityFeature: villa.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
