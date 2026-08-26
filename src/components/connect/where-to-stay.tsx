import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Users } from "lucide-react";
import type { Villa } from "@/lib/types";
import { propertyPath } from "@/lib/property-url";
import { formatNight } from "@/lib/format";

/**
 * "Where to stay" — the experience → property half of the cross-sell.
 *
 * Renders nothing when there is no genuinely nearby inventory, rather than
 * showing an empty heading or padding the row with unrelated properties.
 */
export function WhereToStay({
  villas,
  placeName,
}: {
  villas: Villa[];
  placeName?: string;
}) {
  if (villas.length === 0) return null;

  return (
    <section aria-labelledby="where-to-stay-heading" className="container-page mt-24">
      <h2
        id="where-to-stay-heading"
        className="font-display text-3xl font-bold tracking-tight text-foreground"
      >
        Where to stay
      </h2>
      <p className="mt-1.5 text-muted-foreground">
        {placeName
          ? `Handpicked places to stay in ${placeName}, close to this experience.`
          : "Handpicked places to stay close to this experience."}
      </p>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {villas.map((v) => (
          <li key={v.slug}>
            <Link
              href={propertyPath(v)}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:border-terracotta/40"
            >
              <div className="relative aspect-[16/10]">
                {v.images?.[0] ? (
                  <Image
                    src={v.images[0].src}
                    alt={v.images[0].alt || v.name}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-sand/60">
                    <MapPin
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-title text-lg font-semibold leading-snug text-foreground">
                    {v.name}
                  </h3>
                  {v.reviewCount > 0 && (
                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-sm">
                      <Star
                        className="h-3.5 w-3.5 fill-terracotta text-terracotta"
                        aria-hidden="true"
                      />
                      <span className="font-numeric tabular-nums text-foreground">
                        {v.rating.toFixed(1)}
                      </span>
                    </span>
                  )}
                </div>

                {(v.city || v.state) && (
                  <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin
                      className="h-3.5 w-3.5 text-terracotta"
                      aria-hidden="true"
                    />
                    {[v.city, v.state].filter(Boolean).join(", ")}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {v.maxGuests} guests
                  </span>
                  {v.pricePerNight > 0 && (
                    <span className="font-numeric text-sm font-semibold tabular-nums text-foreground">
                      {formatNight(v.pricePerNight)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
