import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Experience } from "@/lib/types";
import { WhatsAppIcon } from "@/components/icons";
import { TrackedWhatsAppLink } from "@/components/tracked-whatsapp-link";
import { formatINR } from "@/lib/format";

const PHONE_E164 = "919657100004";

function waLink(message: string) {
  return `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(message)}`;
}

/**
 * "Enhance Your Stay" — per-property concierge upsell section on villa
 * detail pages. Each card deep-links to WhatsApp with the experience and
 * property pre-filled so the inquiry arrives ready to action.
 */
export function EnhanceYourStay({
  experiences,
  villaName,
  villaSlug,
}: {
  experiences: Experience[];
  villaName: string;
  villaSlug: string;
}) {
  if (experiences.length === 0) return null;
  return (
    <div>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {experiences.map((e) => (
          <article
            key={e.slug}
            className="group w-[80%] shrink-0 snap-start overflow-hidden rounded-2xl border border-border/60 bg-card sm:w-[46%]"
          >
            <Link
              href={`/experiences/${e.citySlug || "goa"}/${e.slug}`}
              className="relative block aspect-[16/10] overflow-hidden"
            >
              <Image
                src={e.image.src}
                alt={e.image.alt}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </Link>
            <div className="p-5">
              <h3 className="font-title font-semibold text-lg text-foreground">{e.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {e.blurb}
              </p>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <p className="text-sm text-foreground">
                  <span className="text-xs text-muted-foreground">From </span>
                  <span className="font-numeric font-semibold tabular-nums">
                    {formatINR(e.priceFrom ?? 0)}
                  </span>
                  <span className="text-xs text-muted-foreground"> / person</span>
                </p>
                <Link
                  href={`/experiences/${e.citySlug || "goa"}/${e.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-terracotta transition-transform hover:translate-x-0.5"
                >
                  View
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ConciergeBanner villaName={villaName} villaSlug={villaSlug} />
    </div>
  );
}

/**
 * Compact "Need Something Special?" concierge band — echoes the full-width
 * version on /experiences, sized for the villa page column.
 */
export function ConciergeBanner({
  villaName,
  villaSlug,
}: {
  villaName: string;
  villaSlug: string;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-foreground text-background">
      <div className="flex flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-terracotta/90">
            <Sparkles className="h-3.5 w-3.5" />
            Earthy Concierge
          </p>
          <h3 className="mt-2 font-display text-2xl">Need Something Special?</h3>
          <p className="mt-1.5 max-w-md text-sm text-background/75">
            Celebrations, chefs, transfers, or something we haven&apos;t thought
            of — tell our concierge and we&apos;ll arrange it for your stay.
          </p>
        </div>
        <TrackedWhatsAppLink
          href={waLink(
            `Hi Earthy Stays, I'd like help planning something special for my stay at ${villaName}.`,
          )}
          source="concierge-banner"
          villa={villaSlug}
          ariaLabel="Message the Earthy Stays concierge on WhatsApp"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:self-auto"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Message Concierge
        </TrackedWhatsAppLink>
      </div>
    </div>
  );
}
