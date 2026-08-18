import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getHostels, getVillaBySlug } from "@/lib/data/villas";
import { propertyPath } from "@/lib/property-url";
import { PropertyDetail } from "@/app/villas/[slug]/page";

// Render per-request like /villas/[slug]. The shared PropertyDetail reads
// cookies() (getCurrentUser), which can't run during static generation — and
// with zero hostels at build time this route would otherwise be treated as
// static and 500 when a hostel is added later and rendered on-demand.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ city: string; slug: string }> };

export async function generateStaticParams() {
  return getHostels().map((h) => ({ city: h.destinationSlug, slug: h.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const hostel = getVillaBySlug(slug);
  if (!hostel || hostel.type !== "hostel") return { title: "Hostel not found" };
  return {
    title: `${hostel.name} — Hostel`,
    description: hostel.tagline,
    alternates: { canonical: propertyPath(hostel) },
    openGraph: {
      images: hostel.images[0] ? [hostel.images[0].src] : [],
      title: hostel.name,
      description: hostel.tagline,
    },
  };
}

export default async function HostelDetailPage({ params }: PageProps) {
  const { city, slug } = await params;
  const hostel = getVillaBySlug(slug);
  if (!hostel || hostel.type !== "hostel") notFound();
  if (city !== hostel.destinationSlug) redirect(propertyPath(hostel));
  return <PropertyDetail slug={slug} />;
}
