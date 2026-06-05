import Image from "next/image";
import Link from "next/link";
import { HeroSlider } from "@/components/hero-slider";
import { SearchBar } from "@/components/search-bar";
import { SectionHeader } from "@/components/section-header";
import { VillaCard } from "@/components/villa-card";
import { destinations } from "@/lib/data/locations";
import {
  getFeaturedVillas,
  getFeaturedApartments,
  getVillas,
} from "@/lib/data/villas";
import {
  RecentlyVisited,
  type RecentCandidate,
} from "@/components/recently-visited";
import { ReviewsSlider } from "@/components/reviews-slider";
import { getReviews } from "@/lib/data/reviews";
import { CallbackModal } from "@/components/callback-modal";
import { getBanners } from "@/lib/data/banners";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const featured = getFeaturedVillas();
  const featuredApartments = getFeaturedApartments();
  const slides = getBanners();
  // Minimal projection of every property — the client component matches
  // these against localStorage to render the "recently visited" carousel.
  const recentCandidates: RecentCandidate[] = getVillas().map((v) => ({
    slug: v.slug,
    type: (v.type ?? "villa") as "villa" | "apartment",
    name: v.name,
    image: v.images[0]?.src ?? "",
    imageAlt: v.images[0]?.alt ?? v.name,
    rating: v.rating,
    city: v.city,
    state: v.state,
    bedrooms: v.bedrooms,
    bathrooms: v.bathrooms,
    maxGuests: v.maxGuests,
  }));
  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  return (
    <div className="flex flex-col">
      {/* Hero slider */}
      <HeroSlider slides={slides} />

      {/* Search bar, overlapping the bottom of the hero */}
      <div className="relative z-10 -mt-14">
        <SearchBar />
      </div>

      {/* Best rated villas */}
      <section className="container-page py-20">
        <SectionHeader
          eyebrow="Guest favourites"
          title="Best Rated Villas"
          description="Top-rated homes from our collection — picked by guests who actually stayed."
          ctaLabel="See all villas"
          ctaHref="/villas"
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((villa) => (
            <VillaCard
              key={villa.slug}
              villa={villa}
              loggedIn={!!user}
              inWishlist={wishlist.has(villa.slug)}
            />
          ))}
        </div>
      </section>

      {/* Best rated apartments — only rendered if any apartments are marked featured */}
      {featuredApartments.length > 0 && (
        <section className="container-page pb-20">
          <SectionHeader
            eyebrow="Guest favourites"
            title="Best Rated Apartments"
            description="Top-rated city apartments — perfect for short trips and workcations."
            ctaLabel="See all apartments"
            ctaHref="/apartments"
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredApartments.map((apt) => (
              <VillaCard
                key={apt.slug}
                villa={apt}
                loggedIn={!!user}
                inWishlist={wishlist.has(apt.slug)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Destinations */}
      <section className="bg-secondary/40 py-20">
        <div className="container-page">
          <SectionHeader
            eyebrow="Where to go"
            title="Locations"
            description="From beachfront pools to hillside fireplaces — pick a place, we'll do the rest."
            ctaLabel="All destinations"
            ctaHref="/locations"
          />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {destinations.slice(0, 6).map((d) => (
              <Link
                key={d.slug}
                href={`/locations/${d.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl"
              >
                <Image
                  src={d.image.src}
                  alt={d.image.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/80 sm:text-[10px]">
                    {d.region}
                  </p>
                  <h3 className="mt-1 font-display text-lg sm:text-2xl">
                    {d.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/85 sm:mt-1 sm:text-sm">
                    {d.blurb}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recently visited (client-side, only renders if visitor has history) */}
      <RecentlyVisited candidates={recentCandidates} />

      {/* Why us */}
      <section className="bg-primary/5 py-20">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/brand/why-earthy-stays.jpg"
              alt="Earthy Stays villa with pool at golden hour"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
              Why Earthy Stays
            </p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">
              Stay Beyond the Ordinary
            </h2>
            <p className="mt-5 max-w-xl text-muted-foreground">
              At Earthy Stays, we handpick unique villas, apartments, and boutique
              stays that combine comfort, local character, and exceptional
              hospitality. Whether you&apos;re visiting Goa for a beach holiday, a
              workcation, or a long-term stay, we create experiences that feel
              authentic, seamless, and memorable.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-6">
              <div>
                <dt className="font-numeric text-3xl font-semibold tracking-tight tabular-nums text-terracotta">
                  40+
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  Properties Managed
                </dd>
              </div>
              <div>
                <dt className="font-numeric text-3xl font-semibold tracking-tight tabular-nums text-terracotta">
                  2000+
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  Happy Guests
                </dd>
              </div>
              <div>
                <dt className="font-numeric text-3xl font-semibold tracking-tight tabular-nums text-terracotta">
                  4.8★
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  Guest Rating
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Testimonials — managed in /admin/reviews, displayed as a slider */}
      <section className="container-page py-20">
        <SectionHeader
          eyebrow="In their words"
          title="Loved by quiet weekenders"
          align="center"
        />
        <ReviewsSlider reviews={getReviews()} />
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <div className="rounded-3xl bg-foreground px-8 py-16 text-center text-background sm:px-16">
          <h2 className="font-display text-4xl sm:text-5xl">
            Not sure where to start?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-background/80">
            Tell us your dates, your group, and the kind of weekend you&apos;re chasing.
            Our concierge will build you a shortlist within the day.
          </p>
          <div className="mt-8">
            <CallbackModal
              triggerLabel="Talk to a planner →"
              showIcon={false}
              triggerClassName="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
