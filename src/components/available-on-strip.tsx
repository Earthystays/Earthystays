type Partner =
  | { name: string; kind: "svg"; slug: string; color: string }
  | { name: string; kind: "text"; color: string };

/** Simple Icons only carries Airbnb + Booking.com from this list; Agoda /
 *  MakeMyTrip / Goibibo aren't in the registry. Mix-render: SVG mark for
 *  the two that have one, brand-coloured wordmark for the rest. */
const PARTNERS: Partner[] = [
  { name: "Airbnb", kind: "svg", slug: "airbnb", color: "FF5A5F" },
  { name: "Booking.com", kind: "svg", slug: "bookingdotcom", color: "003580" },
  { name: "Agoda", kind: "text", color: "#5D2EB1" },
  { name: "MakeMyTrip", kind: "text", color: "#EB2026" },
  { name: "Goibibo", kind: "text", color: "#E73E7B" },
];

/**
 * "Also available on" trust strip — auto-scrolling marquee. Logos are
 * shown in their brand colour at ~80% opacity so the strip reads as a
 * trust signal rather than an ad. Hover (anywhere on the strip) pauses
 * the loop via .animate-marquee.
 */
export function AvailableOnStrip() {
  const items = [...PARTNERS, ...PARTNERS];

  return (
    <section className="border-y border-border/40 bg-secondary/30 py-10">
      <div className="container-page">
        <p className="text-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Also available on
        </p>
        <div className="mt-6 overflow-hidden">
          <div className="animate-marquee flex w-max items-center gap-x-14 sm:gap-x-20">
            {items.map((p, i) => (
              <PartnerLogo key={`${p.name}-${i}`} partner={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerLogo({ partner }: { partner: Partner }) {
  if (partner.kind === "svg") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- single-color SVG from Simple Icons CDN, not worth optimising via Next/Image
      <img
        src={`https://cdn.simpleicons.org/${partner.slug}/${partner.color}`}
        alt={partner.name}
        width={96}
        height={32}
        className="h-7 w-auto shrink-0 opacity-80 transition-opacity hover:opacity-100 sm:h-8"
        loading="lazy"
      />
    );
  }
  return (
    <span
      className="shrink-0 whitespace-nowrap font-display text-xl font-semibold tracking-tight opacity-80 transition-opacity hover:opacity-100 sm:text-2xl"
      style={{ color: partner.color }}
    >
      {partner.name}
    </span>
  );
}
