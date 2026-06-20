const PARTNERS = [
  { name: "Airbnb", slug: "airbnb" },
  { name: "Booking.com", slug: "booking" },
  { name: "Agoda", slug: "agoda" },
  { name: "MakeMyTrip", slug: "makemytrip" },
  { name: "Goibibo", slug: "goibibo" },
] as const;

/**
 * "Also available on" trust strip — auto-scrolling marquee of OTA logos.
 * Logos served from Simple Icons CDN in a muted grey so the strip reads
 * as a trust signal, not an ad. The PARTNERS list is duplicated in
 * markup so the translateX(-50%) loop is seamless.
 */
export function AvailableOnStrip() {
  return (
    <section className="border-y border-border/40 bg-secondary/30 py-10">
      <div className="container-page">
        <p className="text-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Also available on
        </p>
        <div className="mt-6 overflow-hidden">
          <div className="animate-marquee flex w-max items-center gap-x-16 sm:gap-x-20">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- single-color SVG from Simple Icons CDN; Next/Image would force config + caching for a trivial brand mark
              <img
                key={`${p.slug}-${i}`}
                src={`https://cdn.simpleicons.org/${p.slug}/666`}
                alt={p.name}
                width={96}
                height={32}
                className="h-7 w-auto shrink-0 opacity-70 transition-opacity hover:opacity-100 sm:h-8"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
