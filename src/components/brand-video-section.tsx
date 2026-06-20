import { VillaVideo } from "@/components/villa-video";
import type { ParsedVideo } from "@/lib/video";

/**
 * Cinematic full-bleed brand video block, slotted between Collections and
 * Testimonials on the home page. URL comes from data/brand-video.json
 * (see getBrandVideo); section short-circuits when no URL is configured.
 */
export function BrandVideoSection({
  video,
  title,
}: {
  video: ParsedVideo;
  title: string;
}) {
  return (
    <section className="bg-secondary/40 py-20 sm:py-24">
      <div className="container-page">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
            On film
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl">
            Experience Earthy Stays
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Discover handpicked stays, unforgettable moments, and the
            destinations that make every getaway special.
          </p>
        </header>
        <div className="mt-12 overflow-hidden rounded-3xl bg-foreground/80 shadow-xl">
          <VillaVideo video={video} title={title} />
        </div>
      </div>
    </section>
  );
}
