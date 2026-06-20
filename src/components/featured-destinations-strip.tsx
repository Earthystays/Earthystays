import Link from "next/link";
import type { Destination } from "@/lib/types";

/**
 * Slim destination strip — pinned just above the footer. Pulls from the
 * admin-managed destination list and renders the first N as small links.
 * Centred on desktop, horizontal-scroll on mobile.
 */
const MAX = 6;

export function FeaturedDestinationsStrip({
  destinations,
}: {
  destinations: Destination[];
}) {
  const items = destinations.slice(0, MAX);
  if (items.length === 0) return null;

  return (
    <section className="border-y border-border/50 bg-background py-10">
      <div className="container-page text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
          Explore our destinations
        </p>
        <ul className="mt-5 -mx-5 flex items-center gap-x-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-2 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((d, i) => (
            <li
              key={d.slug}
              className="flex shrink-0 items-center gap-2 sm:shrink"
            >
              <Link
                href={`/locations/${d.slug}`}
                className="font-display text-base uppercase tracking-[0.18em] text-foreground transition-colors hover:text-terracotta sm:text-lg"
              >
                {d.name}
              </Link>
              {i < items.length - 1 && (
                <span
                  aria-hidden
                  className="text-terracotta/60"
                >
                  •
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
