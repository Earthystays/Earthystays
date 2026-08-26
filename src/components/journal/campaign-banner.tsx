import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import type { JournalCampaign } from "@/lib/journal/types";

/** Time-boxed campaign banner shown at the top of the Journal homepage while
 *  the campaign is live (spec §41). Resolves its own visibility upstream. */
export function CampaignBanner({ campaign }: { campaign: JournalCampaign }) {
  return (
    <section className="container-page pt-6">
      <div className="relative isolate overflow-hidden rounded-3xl bg-forest-deep px-8 py-10 sm:px-12 sm:py-14">
        {campaign.image && (
          <Image
            src={campaign.image.src}
            alt={campaign.image.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/90 via-forest-deep/60 to-transparent" />
        <div className="relative max-w-xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white">
            <Sparkles className="h-3.5 w-3.5" /> {campaign.name}
          </p>
          <h2 className="font-serif text-3xl leading-tight text-white sm:text-4xl">
            {campaign.headline}
          </h2>
          {campaign.description && (
            <p className="mt-3 text-white/85">{campaign.description}</p>
          )}
          {campaign.ctaHref && (
            <Link
              href={campaign.ctaHref}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-forest-deep transition-transform hover:scale-[1.02]"
            >
              {campaign.ctaLabel ?? "Explore"} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
