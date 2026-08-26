import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHotels } from "@/lib/data/villas";
import { getStateBySlug } from "@/lib/data/locations";
import { PropertyBrowseIndex } from "@/components/property-browse-index";

/**
 * Hotels in one destination — the middle tier that makes
 * Home → Hotels → Goa → Property a real navigable path.
 *
 * The `[city]` segment is the property's `destinationSlug` (state-level, e.g.
 * "goa"), matching the sibling `[city]/[slug]` detail route so the two agree.
 *
 * A destination with no published hotels 404s rather than rendering an empty
 * page — no thin SEO surface, and no dead link from anywhere in the site.
 */

type PageProps = { params: Promise<{ city: string }> };

function hotelsIn(city: string) {
  return getHotels().filter((h) => h.destinationSlug === city);
}

/** Human name for the destination, preferring the locations catalog. */
function destinationName(city: string): string {
  const state = getStateBySlug(city);
  if (state) return state.name;
  return hotelsIn(city)[0]?.state ?? city;
}

export async function generateStaticParams() {
  // Only destinations that actually hold a hotel.
  return [...new Set(getHotels().map((h) => h.destinationSlug))].map((city) => ({
    city,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  if (hotelsIn(city).length === 0) return { title: "Hotels not found" };
  const name = destinationName(city);
  return {
    title: `Hotels in ${name} | Earthy Stays`,
    description: `Handpicked hotels in ${name} — deluxe rooms to premium suites, with clear pricing and dedicated support.`,
    alternates: { canonical: `/hotels/${city}` },
  };
}

export default async function HotelsByCityPage({ params }: PageProps) {
  const { city } = await params;
  if (hotelsIn(city).length === 0) notFound();

  return (
    <PropertyBrowseIndex
      kind="hotel"
      stateFilter={city}
      destinationName={destinationName(city)}
    />
  );
}
