import type { Villa } from "@/lib/types";
import { getStateBySlug } from "@/lib/data/locations";
import { getAverageRating, getReviewsByVilla } from "@/lib/data/reviews";
import { propertyUrl } from "@/lib/property-url";

/**
 * VacationRental JSON-LD for villa detail pages.
 *
 * Tells Google this URL is a specific accommodation with photos, location,
 * star rating, review count, and price. When Google parses this correctly,
 * the search result for the villa can show:
 *   - ⭐ star rating + review count next to the title
 *   - Price chip
 *   - Image carousel preview
 *   - Map / address row
 *
 * aggregateRating is only emitted when there's at least one real review —
 * a "4.8 · 0 reviews" placeholder would be invalid markup and risks a
 * Google Search Console manual action for misleading structured data.
 */
export function VillaJsonLd({ villa }: { villa: Villa }) {
  const state = getStateBySlug(villa.destinationSlug);
  const url = propertyUrl(villa);
  // Schema.org type per property kind — hotels/hostels are LodgingBusinesses,
  // villas/apartments are VacationRentals.
  const schemaType =
    villa.type === "hotel"
      ? "Hotel"
      : villa.type === "hostel"
        ? "Hostel"
        : "VacationRental";
  const images = villa.images
    .slice(0, 20)
    .map((img) =>
      img.src.startsWith("http") ? img.src : `https://earthystays.com${img.src}`,
    );

  // Prefer real reviews from /admin/reviews; fall back to the villa's
  // legacy rating/count fields when no linked reviews exist yet.
  const linkedReviews = getReviewsByVilla(villa.slug);
  const linkedAvg = getAverageRating(linkedReviews);
  const ratingValue = linkedReviews.length > 0 ? linkedAvg : villa.rating;
  const reviewCount =
    linkedReviews.length > 0 ? linkedReviews.length : villa.reviewCount;

  const data = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": url,
    identifier: villa.slug,
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
    // Required by Google's VacationRental spec: the accommodation itself
    // (rooms/occupancy/amenities) nests under containsPlace, not the
    // listing root — a flat structure is reported as invalid.
    containsPlace: {
      "@type": "Accommodation",
      name: villa.name,
      numberOfBedrooms: villa.bedrooms,
      numberOfBathroomsTotal: villa.bathrooms,
      occupancy: {
        "@type": "QuantitativeValue",
        value: villa.maxGuests,
      },
      amenityFeature: villa.amenities.map((a) => ({
        "@type": "LocationFeatureSpecification",
        name: a,
        value: true,
      })),
      petsAllowed: villa.amenities.some((a) => /pet/i.test(a)),
    },
    aggregateRating:
      ratingValue > 0 && reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: ratingValue.toFixed(1),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review:
      linkedReviews.length > 0
        ? linkedReviews.slice(0, 10).map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: { "@type": "Person", name: r.guestName },
            reviewBody: r.quote,
            // Required for vacation-rental reviews — Google flags review
            // items without it as invalid.
            datePublished: r.createdAt.slice(0, 10),
            ...(r.title ? { name: r.title } : {}),
          }))
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
