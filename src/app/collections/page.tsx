import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllCollections } from "@/lib/data/collections";
import { getVillasByCollection } from "@/lib/data/villas";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated themes: pool villas, pet friendly, beachfront, and more.",
};

export default function CollectionsPage() {
  const collections = getAllCollections();

  return (
    <div className="container-page py-12 lg:py-16">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Collections" }]}
      />
      <header className="mt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-terracotta">
          Browse by theme
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Collections</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Curated lists for the way you travel — by mood, group, or feature.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => {
          const count = getVillasByCollection(c.slug).length;
          return (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl"
            >
              <Image
                src={c.image.src}
                alt={c.image.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <h2 className="font-display text-2xl">{c.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-white/85">
                  {c.blurb}
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/75">
                  {count} {count === 1 ? "villa" : "villas"} →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
