import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Headset,
  ShieldCheck,
  Compass,
  KeyRound,
  BellRing,
  Check,
  Star,
  MessageCircle,
  MapPin,
  User,
} from "lucide-react";
import { formatStayMonth, type StoredReview } from "@/lib/data/reviews";

const TRUST_CARDS = [
  {
    Icon: Sparkles,
    title: "Handpicked properties",
    description:
      "Every villa and apartment is carefully selected to meet our quality standards.",
  },
  {
    Icon: Headset,
    title: "Dedicated reservation team",
    description:
      "Personalized assistance from real people who understand your travel needs.",
  },
  {
    Icon: ShieldCheck,
    title: "Verified listings",
    description:
      "Accurate property info, transparent communication, and no surprises.",
  },
  {
    Icon: Compass,
    title: "Local expertise",
    description:
      "Discover the best locations, hidden gems, and experiences through our local knowledge.",
  },
  {
    Icon: KeyRound,
    title: "Seamless check-in",
    description:
      "Smooth arrival experience with clear communication and support.",
  },
  {
    Icon: BellRing,
    title: "Concierge assistance",
    description:
      "From airport transfers to celebrations and private chefs, we help elevate your stay.",
  },
] as const;

const TRUST_BAR_ITEMS = [
  "Handpicked Villas & Apartments",
  "Dedicated Reservation Team",
  "Seamless Check-In Experience",
  "Concierge Support Throughout Your Stay",
] as const;

const WHATSAPP_URL = "https://wa.me/919657100004";

export function WhyEarthyStays({ reviews }: { reviews: StoredReview[] }) {
  const featured = reviews.slice(0, 3);

  return (
    <section className="bg-secondary/40 py-20 sm:py-24">
      <div className="container-page">
        {/* HEADER */}
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
            Why Earthy Stays
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl">
            More than just a booking platform
          </h2>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            We handpick exceptional stays and provide dedicated support before,
            during, and after your trip — ensuring every getaway is seamless,
            memorable, and stress-free.
          </p>
        </header>

        {/* 6 TRUST CARDS — horizontal snap-slider on mobile, 2-col grid on
            tablet, 3-col grid on desktop. */}
        <ul className="mt-12 -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-5 px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {TRUST_CARDS.map(({ Icon, title, description }) => (
            <li
              key={title}
              className="group w-[72vw] shrink-0 snap-start rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-md sm:w-auto sm:shrink sm:p-6"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta sm:h-12 sm:w-12">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground sm:mt-5 sm:text-xl">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ul>

        {/* TRUST BAR — single-line auto-scrolling marquee. Items are
            duplicated so the translateX(-50%) loop is seamless. Pauses
            on hover. */}
        <div className="mt-12 overflow-hidden rounded-2xl bg-foreground py-5 text-background sm:py-6">
          <p className="text-center text-[11px] uppercase tracking-[0.22em] text-terracotta/90">
            Trusted by Travellers Across India
          </p>
          <div className="mt-4 overflow-hidden">
            <div className="animate-marquee flex w-max gap-x-12 whitespace-nowrap">
              {[...TRUST_BAR_ITEMS, ...TRUST_BAR_ITEMS].map((item, i) => (
                <span
                  key={`${item}-${i}`}
                  className="flex shrink-0 items-center gap-2.5 text-sm text-background/90"
                >
                  <Check
                    className="h-4 w-4 shrink-0 text-terracotta"
                    strokeWidth={2.5}
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* TESTIMONIALS */}
        {featured.length > 0 && (
          <div className="mt-20 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
              In their words
            </p>
            <h3 className="mt-3 font-display text-3xl sm:text-4xl">
              What our guests say
            </h3>
            <ul className="mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-5 px-5 pb-3 text-left [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
              {featured.map((r) => (
                <li
                  key={r.id}
                  className="flex w-[82vw] shrink-0 snap-start flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 sm:w-auto sm:shrink"
                >
                  <header className="flex items-center gap-3">
                    {r.guestPhoto && r.showPhoto !== false ? (
                      <Image
                        src={r.guestPhoto}
                        alt={r.guestName}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                        <User className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {r.guestName}
                      </p>
                      {r.guestLocation && (
                        <p className="truncate text-xs text-muted-foreground">
                          {r.guestLocation}
                        </p>
                      )}
                    </div>
                    <div
                      className="flex shrink-0 gap-0.5 text-terracotta"
                      aria-label={`${r.rating} out of 5`}
                    >
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`h-3.5 w-3.5 ${
                            j < r.rating
                              ? "fill-terracotta"
                              : "fill-none opacity-30"
                          }`}
                        />
                      ))}
                    </div>
                  </header>

                  {r.title && (
                    <p className="font-display text-base font-semibold text-foreground">
                      {r.title}
                    </p>
                  )}
                  <blockquote className="font-display text-base italic leading-snug text-foreground/85">
                    &ldquo;{r.quote}&rdquo;
                  </blockquote>

                  {(r.villaName || r.stayMonth || r.location) && (
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
                      {r.villaName && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-foreground">
                          {r.villaName}
                        </span>
                      )}
                      {r.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {r.location}
                        </span>
                      )}
                      {r.stayMonth && (
                        <span>· Stayed {formatStayMonth(r.stayMonth)}</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FOUNDER STORY */}
        <div className="mt-20 grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted sm:aspect-[4/3] lg:aspect-[4/5]">
            <Image
              src="/brand/why-earthy-stays.jpg"
              alt="Earthy Stays villa at golden hour"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
              Our Story
            </p>
            <h3 className="mt-3 font-display text-3xl sm:text-4xl">
              Why we started Earthy Stays
            </h3>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Earthy Stays was created with a simple belief: exceptional stays
              should feel personal. We handpick every property, work closely
              with owners, and support guests throughout their journey to
              create memorable travel experiences rather than just bookings.
            </p>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="mt-20 rounded-3xl bg-foreground px-6 py-14 text-center text-background sm:px-12 sm:py-16">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta/90">
            Plan your stay
          </p>
          <h3 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl">
            Find your perfect stay
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-sm text-background/75 sm:text-base">
            Discover handpicked villas and apartments across India&apos;s most
            beautiful destinations.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/villas"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore villas
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-background/40 px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background/10"
            >
              <MessageCircle className="h-4 w-4" />
              Talk to our team
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
