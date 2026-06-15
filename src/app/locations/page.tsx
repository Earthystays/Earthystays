import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllDestinations } from "@/lib/data/locations";
import { getVillasByDestination } from "@/lib/data/villas";
import { getStateCover } from "@/lib/data/location-covers";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Locations",
  description: "Earthy Stays across India — by state and city.",
};

export default function LocationsPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Locations" }]} />
      <header className="mt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-terracotta">Where to go</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Locations</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Each state holds its own pace. Pick one to see the cities within — we&apos;ll help you choose the villa.
        </p>
      </header>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {getAllDestinations().map((d) => {
          const count = getVillasByDestination(d.slug).length;
          return (
            <Link
              key={d.slug}
              href={`/locations/${d.slug}`}
              className="group grid grid-cols-[1fr_1fr] overflow-hidden rounded-xl border border-border/60 bg-card transition hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={getStateCover(d.slug) ?? d.image.src}
                  alt={d.image.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-between p-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-terracotta">
                    {d.region}
                  </p>
                  <h2 className="mt-1 font-display text-2xl">{d.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{d.blurb}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <span>{count} {count === 1 ? "villa" : "villas"}</span>
                  <span>{d.cities.length} {d.cities.length === 1 ? "city" : "cities"} →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
