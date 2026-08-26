import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHostels } from "@/lib/data/villas";
import { getStateBySlug } from "@/lib/data/locations";
import { PropertyBrowseIndex } from "@/components/property-browse-index";

/**
 * Hostels in one destination — the middle tier that makes
 * Home → Hostels → Goa → Property a real navigable path.
 *
 * The `[city]` segment is the property's `destinationSlug` (state-level, e.g.
 * "goa"), matching the sibling `[city]/[slug]` detail route so the two agree.
 *
 * A destination with no published hostels 404s rather than rendering an empty
 * page — no thin SEO surface, and no dead link from anywhere in the site.
 */

type PageProps = { params: Promise<{ city: string }> };

function hostelsIn(city: string) {
  return getHostels().filter((h) => h.destinationSlug === city);
}

/** Human name for the destination, preferring the locations catalog. */
function destinationName(city: string): string {
  const state = getStateBySlug(city);
  if (state) return state.name;
  return hostelsIn(city)[0]?.state ?? city;
}

export async function generateStaticParams() {
  // Only destinations that actually hold a hotel.
  return [...new Set(getHostels().map((h) => h.destinationSlug))].map((city) => ({
    city,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  if (hostelsIn(city).length === 0) return { title: "Hostels not found" };
  const name = destinationName(city);
  return {
    title: `Hostels in ${name} | Earthy Stays`,
    description: `Handpicked hotels in ${name} — deluxe rooms to premium suites, with clear pricing and dedicated support.`,
    alternates: { canonical: `/hostels/${city}` },
  };
}

export default async function HostelsByCityPage({ params }: PageProps) {
  const { city } = await params;
  if (hostelsIn(city).length === 0) notFound();

  return (
    <PropertyBrowseIndex
      kind="hostel"
      stateFilter={city}
      destinationName={destinationName(city)}
    />
  );
}
