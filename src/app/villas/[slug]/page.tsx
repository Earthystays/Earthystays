import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, Users, BedDouble, Bath, MapPin, Check, ChefHat, Utensils, ChevronDown } from "lucide-react";
import { VillaGallery } from "@/components/villa-gallery";
import { VillaCard } from "@/components/villa-card";
import { InquiryForm } from "@/components/inquiry-form";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DetailTabs, type DetailTab } from "@/components/detail-tabs";
import { VillaVideo } from "@/components/villa-video";
import { ExpandableText } from "@/components/expandable-text";
import { SpacesGrid } from "@/components/spaces-grid";
import { ExternalReviews } from "@/components/external-reviews";
import { AmenitiesViewer } from "@/components/amenities-viewer";
import { RecentlyVisitedTracker } from "@/components/recently-visited-tracker";
import { MobileInquireBar } from "@/components/mobile-inquire-bar";
import { getVillaBySlug, getVillas } from "@/lib/data/villas";
import { getStateBySlug } from "@/lib/data/locations";
import { formatNight } from "@/lib/format";
import { getAmenityIcon } from "@/lib/amenity-icons";
import { slugify } from "@/lib/slug";
import { getCurrentUser } from "@/lib/session";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getVillas().map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const villa = getVillaBySlug(slug);
  if (!villa) return { title: "Villa not found" };
  return {
    title: villa.name,
    description: villa.tagline,
    openGraph: { images: [villa.images[0].src], title: villa.name, description: villa.tagline },
  };
}

export default async function VillaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const villa = getVillaBySlug(slug);
  if (!villa) notFound();

  const state = getStateBySlug(villa.destinationSlug);
  const citySlug = villa.city ? slugify(villa.city) : null;
  const cityInState = state?.cities.find((c) => c.slug === citySlug);
  const similar = getVillas()
    .filter((v) => v.slug !== villa.slug && v.destinationSlug === villa.destinationSlug)
    .slice(0, 3);
  const user = await getCurrentUser();
  const inWishlist = user?.wishlist.includes(villa.slug) ?? false;
  const wishlistSet = new Set(user?.wishlist ?? []);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Locations", href: "/locations" },
  ];
  if (state) crumbs.push({ label: state.name, href: `/locations/${state.slug}` });
  if (state && cityInState) {
    crumbs.push({
      label: cityInState.name,
      href: `/locations/${state.slug}/${cityInState.slug}`,
    });
  }
  crumbs.push({ label: villa.name, href: "#" });

  const chefAvailable = villa.amenities.some((a) =>
    a.toLowerCase().includes("chef"),
  );
  const petsAllowed = villa.amenities.some((a) =>
    a.toLowerCase().includes("pet"),
  );

  // Build the tabs based on what content actually exists for this villa
  const tabs: DetailTab[] = [{ id: "overview", label: "Overview" }];
  if (villa.video) tabs.push({ id: "video", label: "Video tour" });
  if (villa.highlights.length > 0) tabs.push({ id: "highlights", label: "Highlights" });
  tabs.push({ id: "spaces", label: "Spaces" });
  tabs.push({ id: "amenities", label: "Amenities" });
  tabs.push({ id: "meals", label: "Meals" });
  if (
    villa.cancellationPolicy &&
    (villa.cancellationPolicy.preset || villa.cancellationPolicy.description)
  ) {
    tabs.push({ id: "refund-policy", label: "Refund Policy" });
  }
  tabs.push({ id: "reviews", label: "Reviews" });
  tabs.push({ id: "location", label: "Location" });
  tabs.push({ id: "faqs", label: "FAQ's" });

  return (
    <div>
      {/* Record this view to localStorage so it surfaces on the home page later */}
      <RecentlyVisitedTracker slug={villa.slug} />
      <div className="container-page pt-8">
        <Breadcrumbs items={crumbs} />
      </div>

      <div className="container-page mt-4">
        <VillaGallery
          images={villa.images}
          slug={villa.slug}
          villaName={villa.name}
          rating={villa.rating}
          reviewCount={villa.reviewCount}
          pricePerNight={villa.pricePerNight}
          hasVideo={!!villa.video}
          loggedIn={!!user}
          inWishlist={inWishlist}
        />
      </div>

      {/* Sticky section tabs — directly under the gallery */}
      <div className="mt-6">
        <DetailTabs tabs={tabs} />
      </div>

      {/* Title block BELOW the tabs */}
      <div className="container-page mt-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {villa.name}
        </h1>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground sm:text-base">
          <MapPin className="h-3.5 w-3.5 text-terracotta" />
          {villa.city ? `${villa.city}, ` : ""}{state?.name}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-terracotta text-terracotta" />
            <span className="font-numeric font-semibold tabular-nums">
              {villa.rating.toFixed(2)}
            </span>
            <span className="text-muted-foreground">/5</span>
          </span>
          <span className="text-border">|</span>
          <a
            href="#reviews"
            className="text-terracotta underline underline-offset-2 hover:text-terracotta/80"
          >
            {villa.reviewCount} reviews
          </a>
        </div>
        {villa.tagline && (
          <p className="mt-3 max-w-2xl text-muted-foreground">{villa.tagline}</p>
        )}
      </div>

      <div className="container-page mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-14">
          {/* Quick facts */}
          <div className="grid grid-cols-3 gap-4 rounded-xl border border-border/60 p-5">
            <Fact icon={<BedDouble className="h-4 w-4" />} label="Bedrooms" value={villa.bedrooms} />
            <Fact icon={<Bath className="h-4 w-4" />} label="Bathrooms" value={villa.bathrooms} />
            <Fact icon={<Users className="h-4 w-4" />} label="Max guests" value={villa.maxGuests} />
          </div>

          {/* OVERVIEW */}
          <Section id="overview" title="Overview">
            <ExpandableText text={villa.description} lines={4} />
          </Section>

          {/* VIDEO TOUR */}
          {villa.video && (
            <Section id="video" title="Video tour">
              <VillaVideo video={villa.video} title={villa.name} />
            </Section>
          )}

          {/* HIGHLIGHTS */}
          {villa.highlights.length > 0 && (
            <Section id="highlights" title="Highlights">
              <ul className="grid gap-3 sm:grid-cols-2">
                {villa.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* SPACES */}
          <Section id="spaces" title="Spaces">
            <div className="grid gap-4 sm:grid-cols-3">
              <SpaceCard
                icon={<BedDouble className="h-5 w-5 text-terracotta" />}
                title={`${villa.bedrooms} Bedroom${villa.bedrooms === 1 ? "" : "s"}`}
                sub="Air-conditioned · linen included"
              />
              <SpaceCard
                icon={<Bath className="h-5 w-5 text-terracotta" />}
                title={`${villa.bathrooms} Bathroom${villa.bathrooms === 1 ? "" : "s"}`}
                sub="Hot water · towels & toiletries"
              />
              <SpaceCard
                icon={<Users className="h-5 w-5 text-terracotta" />}
                title={`Sleeps ${villa.maxGuests}`}
                sub="Extra beds on request"
              />
            </div>

            {/* Tagged photo tiles per space */}
            <div className="mt-8">
              <SpacesGrid images={villa.images} slug={villa.slug} />
            </div>
            {villa.houseRules.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-foreground">House rules</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {villa.houseRules.map((r) => (
                    <li key={r}>· {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          {/* AMENITIES (merged: amenities + facilities, deduplicated) */}
          <Section id="amenities" title="Amenities">
            {(() => {
              const merged: string[] = [];
              const seen = new Set<string>();
              for (const name of [
                ...villa.amenities,
                ...(villa.facilities ?? []),
              ]) {
                const key = name.toLowerCase().trim();
                if (!seen.has(key)) {
                  seen.add(key);
                  merged.push(name);
                }
              }
              const items = merged.map((name) => {
                const Icon = getAmenityIcon(name);
                return {
                  name,
                  icon: (
                    <Icon
                      className="h-6 w-6 text-foreground/80"
                      strokeWidth={1.4}
                    />
                  ),
                };
              });
              return <AmenitiesViewer items={items} />;
            })()}
          </Section>


          {/* MEALS */}
          <Section id="meals" title="Meals">
            {chefAvailable ? (
              <div className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-start gap-3">
                  <ChefHat className="h-6 w-6 text-terracotta shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="font-medium text-foreground">In-house chef available</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A house chef is included with your stay. Share dietary preferences in advance
                      and they&apos;ll plan breakfast, lunch and dinner accordingly. Groceries are billed
                      at cost; alcohol is not provided.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-start gap-3">
                  <Utensils className="h-6 w-6 text-terracotta shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="font-medium text-foreground">Self-catering</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The villa has a full kitchen. We can arrange a cook or chef on request — ask
                      our concierge when you inquire.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* REFUND POLICY */}
          {villa.cancellationPolicy &&
            (villa.cancellationPolicy.preset || villa.cancellationPolicy.description) && (
              <Section id="refund-policy" title="Refund Policy">
                {villa.cancellationPolicy.preset && (
                  <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                    {villa.cancellationPolicy.preset}
                  </Badge>
                )}
                {villa.cancellationPolicy.description && (
                  <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                    {villa.cancellationPolicy.description}
                  </p>
                )}
              </Section>
            )}

          {/* REVIEWS */}
          <Section id="reviews" title="Reviews">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-numeric text-5xl font-semibold tracking-tight tabular-nums text-foreground">{villa.rating.toFixed(2)}</p>
                  <div className="mt-1 flex items-center gap-0.5 text-terracotta">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(villa.rating) ? "fill-terracotta" : "fill-none"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="border-l border-border pl-4">
                  <p className="text-sm text-muted-foreground">
                    Loved by {villa.reviewCount} past guests
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Detailed guest reviews coming soon. Our concierge is happy to share recent guest
                    notes — just ask.
                  </p>
                </div>
              </div>
            </div>

            {villa.externalListings && villa.externalListings.length > 0 && (
              <div className="mt-6">
                <ExternalReviews villa={villa} />
              </div>
            )}
          </Section>

          {/* LOCATION */}
          <Section id="location" title="Location">
            {(villa.city || villa.state) && (
              <p className="text-sm text-foreground">
                {[villa.city, villa.state].filter(Boolean).join(", ")}
              </p>
            )}
            <p className="mt-2 text-muted-foreground">{villa.locationNote}</p>
            {typeof villa.latitude === "number" && typeof villa.longitude === "number" ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
                <iframe
                  title={`Map of ${villa.name}`}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${villa.longitude - 0.01}%2C${villa.latitude - 0.01}%2C${villa.longitude + 0.01}%2C${villa.latitude + 0.01}&layer=mapnik&marker=${villa.latitude}%2C${villa.longitude}`}
                  className="aspect-[16/9] w-full"
                  loading="lazy"
                />
                <div className="flex items-center justify-between bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                  <span>
                    {villa.latitude.toFixed(4)}, {villa.longitude.toFixed(4)}
                  </span>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${villa.latitude}&mlon=${villa.longitude}#map=15/${villa.latitude}/${villa.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracotta hover:underline"
                  >
                    View larger map ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4 aspect-[16/9] rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
                Add latitude & longitude in the admin to show a map here.
              </div>
            )}
          </Section>

          {/* FAQ */}
          <Section id="faqs" title="FAQ's">
            <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
              {villa.faqs && villa.faqs.length > 0 ? (
                villa.faqs.map((f, i) => (
                  <Faq key={i} question={f.question}>
                    {f.answer}
                  </Faq>
                ))
              ) : (
                <>
                  <Faq question="What are the check-in and check-out times?">
                    {villa.houseRules.find((r) => r.toLowerCase().includes("check"))
                      ?? "Standard check-in is 2pm, check-out is 11am. Early or late requests can be made through our concierge."}
                  </Faq>
                  <Faq question="Are pets allowed?">
                    {petsAllowed
                      ? "Yes, this villa welcomes pets. Please mention your pet (and breed/size) in your inquiry so we can prep accordingly."
                      : "This villa is not pet-friendly. Browse our pet-friendly collection for villas that welcome four-legged guests."}
                  </Faq>
                  <Faq question="Are meals included?">
                    {chefAvailable
                      ? "An in-house chef is included. Breakfast, lunch and dinner are prepared on request; groceries are billed at cost."
                      : "Meals are not included by default — the villa has a full kitchen. We can arrange a cook on request."}
                  </Faq>
                  <Faq question="How do I book?">
                    Send an inquiry with your dates and group size through the form on this page (or the
                    Plan a stay button in the header). A concierge planner will confirm pricing and
                    availability within a few hours.
                  </Faq>
                  <Faq question="Is there a security deposit?">
                    A refundable security deposit may apply for some properties — our concierge will
                    share the exact amount when confirming your stay.
                  </Faq>
                </>
              )}
            </div>
          </Section>
        </div>

        {/* Sticky inquiry */}
        <aside className="lg:sticky lg:top-44 self-start">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">From</p>
            <p className="mt-1 font-numeric text-3xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatNight(villa.pricePerNight)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Final pricing depends on dates & group size.
            </p>
            <div className="mt-5">
              <InquiryForm villaSlug={villa.slug} villaName={villa.name} />
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="container-page mt-24">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">More in {state?.name}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((v) => (
              <VillaCard
                key={v.slug}
                villa={v}
                loggedIn={!!user}
                inWishlist={wishlistSet.has(v.slug)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mobile-only sticky bottom bar with price + Enquire CTA */}
      <MobileInquireBar
        villaSlug={villa.slug}
        villaName={villa.name}
        pricePerNight={villa.pricePerNight}
      />
    </div>
  );
}

function Section({
  id,
  title,
  sub,
  children,
}: {
  id: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-44">
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-1 font-numeric text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SpaceCard({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2">{icon}</div>
      <p className="mt-3 font-display text-xl font-bold tracking-tight text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Faq({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </details>
  );
}
