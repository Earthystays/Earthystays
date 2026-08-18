import type { Experience } from "@/lib/types";

/** schema.org TouristTrip so Google can show rich results. */
export function ExperienceJsonLd({ e }: { e: Experience }) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: e.name,
    description: e.hero?.description ?? e.overview ?? e.blurb,
    image: [e.image.src, ...(e.gallery ?? []).map((g) => g.src)].slice(0, 6),
  };

  if (typeof e.priceFrom === "number") {
    data.offers = {
      "@type": "Offer",
      price: e.priceFrom,
      priceCurrency: e.currency ?? "INR",
      availability: "https://schema.org/InStock",
    };
  }
  if (typeof e.rating === "number" && typeof e.reviewCount === "number" && e.reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: e.rating,
      reviewCount: e.reviewCount,
      bestRating: 5,
    };
  }
  if (e.city) {
    data.itinerary = {
      "@type": "Place",
      name: [e.city, e.state].filter(Boolean).join(", "),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
