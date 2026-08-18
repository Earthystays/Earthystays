import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getHotels, getVillaBySlug } from "@/lib/data/villas";
import { propertyPath } from "@/lib/property-url";
import { PropertyDetail } from "@/app/villas/[slug]/page";

// Render per-request like /villas/[slug]. The shared PropertyDetail reads
// cookies() (getCurrentUser), which can't run during static generation — and
// with zero hotels at build time this route would otherwise be treated as
// static and 500 when a hotel is added later and rendered on-demand.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ city: string; slug: string }> };

export async function generateStaticParams() {
  return getHotels().map((h) => ({ city: h.destinationSlug, slug: h.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const hotel = getVillaBySlug(slug);
  if (!hotel || hotel.type !== "hotel") return { title: "Hotel not found" };
  return {
    title: `${hotel.name} — Hotel`,
    description: hotel.tagline,
    alternates: { canonical: propertyPath(hotel) },
    openGraph: {
      images: hotel.images[0] ? [hotel.images[0].src] : [],
      title: hotel.name,
      description: hotel.tagline,
    },
  };
}

export default async function HotelDetailPage({ params }: PageProps) {
  const { city, slug } = await params;
  const hotel = getVillaBySlug(slug);
  if (!hotel || hotel.type !== "hotel") notFound();
  // Keep the canonical city segment — redirect a stale/incorrect one.
  if (city !== hotel.destinationSlug) redirect(propertyPath(hotel));
  return <PropertyDetail slug={slug} />;
}
