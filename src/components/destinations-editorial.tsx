import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getStateCover } from "@/lib/data/location-covers";
import type { Destination } from "@/lib/types";

function Card({ destination }: { destination: Destination }) {
  const cover = getStateCover(destination.slug) ?? destination.image.src;
  return (
    <Link
      href={`/locations/${destination.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl"
    >
      <Image
        src={cover}
        alt={destination.image.alt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/35" />

      <h3 className="font-display absolute left-3 top-3 text-lg font-normal leading-tight text-white drop-shadow-sm sm:left-6 sm:top-5 sm:text-3xl lg:text-4xl">
        {destination.name}
      </h3>

      <span
        aria-hidden
        className="absolute bottom-2.5 right-2.5 grid h-7 w-7 place-items-center rounded-full bg-white text-neutral-900 shadow-sm transition-transform duration-300 group-hover:translate-x-1 sm:bottom-5 sm:right-5 sm:h-10 sm:w-10"
      >
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export function DestinationsEditorial({
  destinations,
}: {
  destinations: Destination[];
}) {
  if (destinations.length === 0) return null;

  const picks = destinations;

  return (
    <section className="container-page py-14 sm:py-20">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[color:var(--terracotta)]">
          <span className="h-px w-8 bg-[color:var(--terracotta)]/40" />
          Explore destinations
          <span className="h-px w-8 bg-[color:var(--terracotta)]/40" />
        </div>
        <h2 className="font-display mt-5 text-4xl leading-[1.1] text-foreground sm:text-5xl lg:text-[3.25rem]">
          Handpicked locations across India
        </h2>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-3 sm:mt-14 sm:gap-5 lg:grid-cols-3">
        {picks.map((d) => (
          <Card key={d.slug} destination={d} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/villas"
          className="group inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--terracotta)]"
        >
          View all destinations
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
