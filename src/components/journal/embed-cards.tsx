import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Bath, Star, Clock, ArrowRight } from "lucide-react";
import type { Villa, Experience, Image as ImageType } from "@/lib/types";
import { propertyPath } from "@/lib/property-url";
import { experienceHref } from "@/lib/data/experiences";
import { formatINR } from "@/lib/format";

/* Compact editorial cards for in-article embeds. Property & experience data
 * is passed in already-resolved from the central stores — never duplicated. */

export function PropertyEmbedCard({ villa }: { villa: Villa }) {
  const img = villa.images?.[0];
  return (
    <Link
      href={propertyPath(villa)}
      data-track-property={villa.slug}
      className="group my-8 grid overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[minmax(0,42%)_1fr]"
    >
      <div className="relative aspect-[4/3] sm:aspect-auto">
        {img ? (
          <Image
            src={img.src}
            alt={img.alt || villa.name}
            fill
            sizes="(max-width: 640px) 100vw, 42vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      <div className="flex flex-col justify-center gap-2 p-6">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {villa.city || villa.destinationSlug}
        </div>
        <h4 className="font-title text-xl font-semibold text-foreground">
          {villa.name}
        </h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" />
            {villa.bedrooms} bed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            {villa.bathrooms} bath
          </span>
          {villa.rating > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-terracotta text-terracotta" />
              {villa.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            From{" "}
            <span className="font-title font-semibold text-foreground">
              {formatINR(villa.pricePerNight)}
            </span>{" "}
            / night
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-forest group-hover:gap-2 transition-all">
            View {villa.name.split(" ")[0]}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ExperienceEmbedCard({ exp }: { exp: Experience }) {
  return (
    <Link
      href={experienceHref(exp)}
      data-track-experience={exp.slug}
      className="group my-8 grid overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[minmax(0,42%)_1fr]"
    >
      <div className="relative aspect-[4/3] sm:aspect-auto">
        {exp.image?.src ? (
          <Image
            src={exp.image.src}
            alt={exp.image.alt || exp.name}
            fill
            sizes="(max-width: 640px) 100vw, 42vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      <div className="flex flex-col justify-center gap-2 p-6">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {exp.city || exp.citySlug}
        </div>
        <h4 className="font-title text-xl font-semibold text-foreground">
          {exp.name}
        </h4>
        {exp.blurb && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{exp.blurb}</p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {exp.duration && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {exp.duration}
              </span>
            )}
            {typeof exp.priceFrom === "number" && (
              <span>
                From{" "}
                <span className="font-title font-semibold text-foreground">
                  {formatINR(exp.priceFrom)}
                </span>
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-forest group-hover:gap-2 transition-all">
            View
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}


/* ─────────────────── merchandising embeds ─────────────────── */

/**
 * Collection card for the journal. Resolves the collection live and reports
 * how many stays it currently holds, so an article never advertises an
 * emptied-out collection.
 */
export function CollectionEmbedCard({
  collection,
  count,
}: {
  collection: { slug: string; name: string; blurb?: string; image?: ImageType };
  count: number;
}) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group my-10 flex overflow-hidden rounded-2xl border border-border/60 bg-card no-underline transition-colors hover:border-terracotta/40"
    >
      {collection.image?.src && (
        <div className="relative hidden w-44 shrink-0 sm:block">
          <Image
            src={collection.image.src}
            alt={collection.image.alt || collection.name}
            fill
            sizes="176px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="flex-1 p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Collection
        </p>
        <h3 className="mt-1 font-title text-lg font-semibold text-foreground">
          {collection.name}
        </h3>
        {collection.blurb && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {collection.blurb}
          </p>
        )}
        {count > 0 && (
          <p className="mt-2 font-numeric text-xs tabular-nums text-muted-foreground">
            {count} {count === 1 ? "stay" : "stays"}
          </p>
        )}
      </div>
    </Link>
  );
}

/** Destination card linking to the destination hub. */
export function DestinationEmbedCard({
  slug,
  name,
  location,
  description,
}: {
  slug: string;
  name: string;
  location?: string;
  description?: string;
}) {
  return (
    <Link
      href={`/journal/destination/${slug}`}
      className="group my-10 block overflow-hidden rounded-2xl border border-border/60 bg-card p-5 no-underline transition-colors hover:border-terracotta/40"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Destination{location ? ` · ${location}` : ""}
      </p>
      <h3 className="mt-1 font-title text-lg font-semibold text-foreground group-hover:text-terracotta">
        {name}
      </h3>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </Link>
  );
}
