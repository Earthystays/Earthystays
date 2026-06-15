import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllCollections, getCollectionBySlug } from "@/lib/data/collections";
import { getVillasByCollection } from "@/lib/data/villas";
import { VillaCard } from "@/components/villa-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/session";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllCollections().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const col = getCollectionBySlug(slug);
  if (!col) return { title: "Not found" };
  return {
    title: col.name,
    description: col.blurb,
    openGraph: { images: [col.image.src] },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const col = getCollectionBySlug(slug);
  if (!col) notFound();
  const villas = getVillasByCollection(col.slug);
  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  return (
    <div>
      <section className="relative h-[50vh] min-h-[360px] sm:h-[55vh] sm:min-h-[400px]">
        <Image
          src={col.image.src}
          alt={col.image.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/70" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-10 text-white">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Collections", href: "/collections" },
              { label: col.name },
            ]}
          />
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/80">
            Collection
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-6xl">{col.name}</h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            {col.blurb}
          </p>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-terracotta">
              {col.name}
            </p>
            <h2 className="mt-2 font-display text-2xl sm:text-4xl">
              {villas.length} {villas.length === 1 ? "stay" : "stays"}
            </h2>
          </div>
        </div>

        {villas.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
            <p className="font-display text-xl sm:text-2xl">
              No stays tagged with this collection yet.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tag villas with this collection from the admin to populate this page.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {villas.map((v) => (
              <VillaCard
                key={v.slug}
                villa={v}
                loggedIn={!!user}
                inWishlist={wishlist.has(v.slug)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
