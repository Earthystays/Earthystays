import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVillaBySlug, getVillas } from "@/lib/data/villas";
import { PhotoViewer } from "@/components/photo-viewer";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getVillas().map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const villa = getVillaBySlug(slug);
  if (!villa) return { title: "Photos" };
  return {
    title: `Photos · ${villa.name}`,
    description: `Browse photos of ${villa.name}`,
  };
}

export default async function VillaPhotosPage({ params }: PageProps) {
  const { slug } = await params;
  const villa = getVillaBySlug(slug);
  if (!villa) notFound();
  return <PhotoViewer villa={villa} />;
}
