import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getHostels, getVillaBySlug } from "@/lib/data/villas";
import { propertyPath } from "@/lib/property-url";
import { PropertyDetail } from "@/app/villas/[slug]/page";

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
