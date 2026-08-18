import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { Star, Users, BedDouble, Bath, MapPin, Check, ChefHat, Utensils, ChevronDown, FileText } from "lucide-react";
import { LocationMap } from "@/components/location-map";
import { VillaGallery } from "@/components/villa-gallery";
import { VillaCard } from "@/components/villa-card";
import { InquiryForm } from "@/components/inquiry-form";
import { ConnectWithHost } from "@/components/connect-with-host";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DetailTabs, type DetailTab } from "@/components/detail-tabs";
import { VillaVideo } from "@/components/villa-video";
import { ExpandableText } from "@/components/expandable-text";
import { SpacesGrid } from "@/components/spaces-grid";
import { ScrollSlider } from "@/components/scroll-slider";
import { ExternalReviews } from "@/components/external-reviews";
import { GuestReviews } from "@/components/reviews/guest-reviews";
import { computeReviewSummary, getReviewsByVilla } from "@/lib/data/reviews";
import {
  getGoogleReviewsAsStored,
  refreshGoogleReviewsIfStale,
} from "@/lib/data/google-reviews";
import { AmenitiesViewer } from "@/components/amenities-viewer";
import { RecentlyVisitedTracker } from "@/components/recently-visited-tracker";
import { VillaViewTracker } from "@/components/villa-view-tracker";
import { MobileInquireBar } from "@/components/mobile-inquire-bar";
import { VillaJsonLd } from "@/components/jsonld-villa";
import { BreadcrumbJsonLd } from "@/components/jsonld-breadcrumb";
import { EnhanceYourStay } from "@/components/enhance-your-stay";
import { getVillaBySlug, getVillas } from "@/lib/data/villas";
import { propertyPath } from "@/lib/property-url";
import { HotelRooms } from "@/components/hotel-rooms";
import { DormsSection } from "@/components/dorms-section";
import { hasUnits as villaHasUnits, startingFromPrice } from "@/lib/data/units";
import { getRatesForProperty } from "@/lib/data/unit-rates";
import { getBlockedDatesForProperty } from "@/lib/data/unit-blocked-dates";
import { getPublishedExperiences } from "@/lib/data/experiences";
import { getStateBySlug } from "@/lib/data/locations";
import { formatNight } from "@/lib/format";
import { getAmenityIcon } from "@/lib/amenity-icons";
import { slugify } from "@/lib/slug";
import { getCurrentUser } from "@/lib/session";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  // Hotels & hostels have their own /hotels and /hostels routes — this route
  // only pre-renders villas & apartments (and redirects the rest).
  return getVillas()
    .filter((v) => v.type !== "hotel" && v.type !== "hostel")
    .map((v) => ({ slug: v.slug }));
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

/**
 * Shared property detail view (Phase I). Rendered by the /villas, /hotels and
 * /hostels routes so all three property kinds share one implementation. The
 * route decides reachability; this component decides presentation.
 */
export async function PropertyDetail({ slug }: { slug: string }) {
  const villa = getVillaBySlug(slug);
  if (!villa) notFound();

  const state = getStateBySlug(villa.destinationSlug);
  const citySlug = villa.city ? slugify(villa.city) : null;
  const cityInState = state?.cities.find((c) => c.slug === citySlug);
  const similar = getVillas()
    .filter((v) => v.slug !== villa.slug && v.destinationSlug === villa.destinationSlug)
    .slice(0, 3);
  // Own reviews + cached Google imports (fire-and-forget refresh when stale).
  if (villa.googlePlaceId) refreshGoogleReviewsIfStale(villa.googlePlaceId);
  const villaReviews = [
    ...getReviewsByVilla(villa.slug),
    ...(villa.googlePlaceId ? getGoogleReviewsAsStored(villa.googlePlaceId) : []),
  ];
  const reviewSummary = computeReviewSummary(villaReviews);
  // Resolve assigned experience slugs against the live catalog so renamed
  // or deleted experiences never render stale cards. When a villa has no
  // (matching) assignments, fall back to published experiences in the same
  // city so the cross-sell still appears — admins can override by assigning.
  const published = getPublishedExperiences();
  const villaCitySlug = villa.city ? slugify(villa.city) : null;
  const villaStateName = state?.name?.toLowerCase() ?? null;
  const assignedBySlug =
    villa.experiences && villa.experiences.length > 0
      ? published.filter((e) => villa.experiences!.includes(e.slug))
      : [];
  // Fallback matches experiences to the villa's region — by state/destination
  // (experiences are seeded at state level, e.g. citySlug "goa") or by an
  // exact town match if a town-specific experience exists.
  const assignedExperiences =
    assignedBySlug.length > 0
      ? assignedBySlug
      : published
          .filter(
            (e) =>
              e.citySlug === villa.destinationSlug ||
              (villaStateName && e.state?.toLowerCase() === villaStateName) ||
              (villaCitySlug && e.citySlug === villaCitySlug),
          )
          .sort(
            (a, b) =>
              (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
              (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99),
          )
          .slice(0, 4);
  const user = await getCurrentUser();
  const inWishlist = user?.wishlist.includes(villa.slug) ?? false;
  const wishlistSet = new Set(user?.wishlist ?? []);

  const crumbs = [{ label: "Home", href: "/" }];
  if (state && cityInState) {
    crumbs.push({
      label: cityInState.name,
      href: `/locations/${state.slug}/${cityInState.slug}`,
    });
  }
  crumbs.push({ label: villa.name, href: propertyPath(villa) });

  const chefAvailable = villa.amenities.some((a) =>
    a.toLowerCase().includes("chef"),
  );

  // Meals: prefer the per-villa setting; for villas saved before this
  // field existed, fall back to the old amenity-based heuristic.
  const mealsPreset = villa.meals?.preset;
  const mealsDescription = villa.meals?.description?.trim() ?? "";
  const mealsChefIncluded =
    mealsPreset === "chef-included" || mealsPreset === "all-meals";
  const mealsBreakfast = mealsPreset === "breakfast";
  const mealsSelfCatering =
    mealsPreset === "self-catering" || mealsPreset === "chef-on-request";
  const hasMealsSetting = !!mealsPreset || !!mealsDescription;
  const petsAllowed = villa.amenities.some((a) =>
    a.toLowerCase().includes("pet"),
  );

  // Hotel/hostel listings surface their room/dorm types where a villa shows
  // its "Spaces". Everything else on the page is shared.
  const isHotel = villa.type === "hotel";
  const isHostel = villa.type === "hostel";
  const showUnits = (isHotel || isHostel) && villaHasUnits(villa);
  const spacesLabel = isHotel ? "Rooms" : isHostel ? "Dorms" : "Spaces";
  const displayPrice = showUnits ? startingFromPrice(villa) : villa.pricePerNight;
  // Per-unit rate & inventory overrides + blocked dates for the 7-day strip.
  const overridesByUnit = showUnits ? await getRatesForProperty(villa.slug) : {};
  const blockedByUnit = showUnits ? await getBlockedDatesForProperty(villa.slug) : {};

  // Build the tabs based on what content actually exists for this villa
  const tabs: DetailTab[] = [{ id: "overview", label: "Overview" }];
  if (villa.video) tabs.push({ id: "video", label: "Video tour" });
  if (villa.highlights.length > 0) tabs.push({ id: "highlights", label: "Highlights" });
  tabs.push({ id: "spaces", label: spacesLabel });
  tabs.push({ id: "amenities", label: "Amenities" });
  tabs.push({ id: "meals", label: "Meals" });
  if (assignedExperiences.length > 0) {
    tabs.push({ id: "experiences", label: "Experiences" });
  }
  if (
    villa.cancellationPolicy &&
    (villa.cancellationPolicy.preset || villa.cancellationPolicy.description)
  ) {
    tabs.push({ id: "refund-policy", label: "Refund Policy" });
  }
  tabs.push({ id: "location", label: "Location" });
  tabs.push({ id: "reviews", label: "Reviews" });
  tabs.push({ id: "faqs", label: "FAQ's" });

  return (
    <div>
      {/* JSON-LD so Google can show rich results (star rating, price, photos) */}
      <VillaJsonLd villa={villa} />
      <BreadcrumbJsonLd items={crumbs} />
      {/* Record this view to localStorage so it surfaces on the home page later */}
      <RecentlyVisitedTracker slug={villa.slug} />
      {/* Record a server-side view event for popularity-based listing sort */}
      <VillaViewTracker slug={villa.slug} pricePerNight={villa.pricePerNight} />
      <div className="container-page !max-w-[88rem] pt-8">
        <Breadcrumbs items={crumbs} />
      </div>

      <div className="container-page !max-w-[88rem] mt-4">
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

      {/* Sticky section tabs — directly under the gallery. Rendered as a
          direct child of the page root (not a tightly-fit wrapper div) so
          its containing block spans the full page height — otherwise a
          sticky element can only stay "stuck" for as long as its immediate
          parent's box remains on screen, and a wrapper that's only as tall
          as the tab bar itself gives it nowhere to stick to. */}
      <DetailTabs tabs={tabs} className="!max-w-[88rem]" />


      <div className="container-page !max-w-[88rem] mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-10">
          {/* Title block — inside the grid so the booking sidebar can
              start at the same vertical position instead of leaving a
              tall empty band on the right. */}
          <header>
            <h1 className="font-title text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {villa.name}
            </h1>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground sm:text-base">
              <MapPin className="h-3.5 w-3.5 text-terracotta" />
              {villa.city ? `${villa.city}, ` : ""}{state?.name}
            </p>
            {villa.reviewCount > 0 && (
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
            )}
            {villa.tagline && (
              <p className="mt-3 max-w-2xl text-muted-foreground">{villa.tagline}</p>
            )}
          </header>

          <div className="space-y-14">
          {/* Quick facts */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Fact icon={<Users className="h-4 w-4 md:h-5 md:w-5" />} label={`Up to ${villa.maxGuests} Guests`} />
            <Fact icon={<BedDouble className="h-4 w-4 md:h-5 md:w-5" />} label={`${villa.bedrooms} ${villa.bedrooms === 1 ? "Room" : "Rooms"}`} />
            <Fact icon={<Bath className="h-4 w-4 md:h-5 md:w-5" />} label={`${villa.bathrooms} ${villa.bathrooms === 1 ? "Bath" : "Baths"}`} />
            {villa.brochure && (
              <a
                href={villa.brochure.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 md:gap-2.5 md:px-5 md:py-3 md:text-base"
              >
                <FileText className="h-4 w-4 text-terracotta md:h-5 md:w-5" />
                View Brochure
              </a>
            )}
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

          {/* SPACES — villas show a photo grid; hotels/hostels show their
              room / dorm types as bookable cards. */}
          <Section id="spaces" title={spacesLabel}>
            {showUnits && isHostel ? (
              <DormsSection
                slug={villa.slug}
                units={villa.units!}
                overridesByUnit={overridesByUnit}
                blockedByUnit={blockedByUnit}
              />
            ) : showUnits ? (
              <HotelRooms
                slug={villa.slug}
                units={villa.units!}
                overridesByUnit={overridesByUnit}
                blockedByUnit={blockedByUnit}
              />
            ) : (
              <SpacesGrid images={villa.images} slug={villa.slug} />
            )}
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
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <div className="flex items-start gap-3">
                {hasMealsSetting ? (
                  mealsChefIncluded ? (
                    <ChefHat className="h-6 w-6 text-terracotta shrink-0" strokeWidth={1.5} />
                  ) : (
                    <Utensils className="h-6 w-6 text-terracotta shrink-0" strokeWidth={1.5} />
                  )
                ) : chefAvailable ? (
                  <ChefHat className="h-6 w-6 text-terracotta shrink-0" strokeWidth={1.5} />
                ) : (
                  <Utensils className="h-6 w-6 text-terracotta shrink-0" strokeWidth={1.5} />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {hasMealsSetting
                      ? mealsPreset === "chef-included"
                        ? "In-house chef included"
                        : mealsPreset === "all-meals"
                          ? "All meals included"
                          : mealsPreset === "breakfast"
                            ? "Breakfast included"
                            : mealsPreset === "chef-on-request"
                              ? "Chef on request"
                              : mealsPreset === "self-catering"
                                ? "Self-catering"
                                : "Meals"
                      : chefAvailable
                        ? "In-house chef available"
                        : "Self-catering"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                    {hasMealsSetting
                      ? mealsDescription ||
                        (mealsChefIncluded
                          ? "A house chef is included with your stay."
                          : mealsBreakfast
                            ? "Breakfast is prepared by the house staff every morning."
                            : mealsSelfCatering
                              ? "The villa has a full kitchen. We can arrange a cook or chef on request."
                              : "")
                      : chefAvailable
                        ? "A house chef is included with your stay. Share dietary preferences in advance and they'll plan breakfast, lunch and dinner accordingly. Groceries are billed at cost; alcohol is not provided."
                        : "The villa has a full kitchen. We can arrange a cook or chef on request — ask our concierge when you inquire."}
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* ENHANCE YOUR STAY — concierge experiences assigned to this property */}
          {assignedExperiences.length > 0 && (
            <Section
              id="experiences"
              title="Enhance Your Stay"
              sub="Handpicked add-ons our concierge can arrange for this property"
            >
              <EnhanceYourStay
                experiences={assignedExperiences}
                villaName={villa.name}
                villaSlug={villa.slug}
              />
            </Section>
          )}

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
                <LocationMap
                  latitude={villa.latitude}
                  longitude={villa.longitude}
                  title={`Map of ${villa.name}`}
                />
                <div className="flex items-center justify-between bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                  <span>
                    {villa.latitude.toFixed(4)}, {villa.longitude.toFixed(4)}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${villa.latitude},${villa.longitude}`}
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

          {/* REVIEWS */}
          <Section id="reviews" title="Guest Reviews">
            <GuestReviews
              villaSlug={villa.slug}
              villaName={villa.name}
              reviews={villaReviews}
              summary={reviewSummary}
              fallbackRating={villa.rating}
              fallbackCount={villa.reviewCount}
              viewer={user ? { name: user.name, email: user.email } : null}
            />

            {villa.externalListings && villa.externalListings.length > 0 && (
              <div className="mt-8">
                <ExternalReviews villa={villa} />
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
                    {hasMealsSetting
                      ? mealsDescription ||
                        (mealsChefIncluded
                          ? "An in-house chef is included. Breakfast, lunch and dinner are prepared on request; groceries are billed at cost."
                          : mealsBreakfast
                            ? "Breakfast is included with your stay. Lunch and dinner are not."
                            : "Meals are not included by default — the villa has a full kitchen. We can arrange a cook on request.")
                      : chefAvailable
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
        </div>

        {/* Sticky inquiry — desktop only; mobile uses the sticky MobileInquireBar */}
        <aside id="inquire" className="hidden scroll-mt-32 self-start lg:sticky lg:top-32 lg:block">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            {/* Price header — sand background, matches Experience inquiry card */}
            <div className="bg-sand/60 px-6 pb-6 pt-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Starting from
              </p>
              <p className="mt-1 font-numeric text-[34px] font-bold leading-none tabular-nums text-foreground">
                {formatNight(displayPrice)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Final pricing depends on dates & group size.
              </p>
            </div>
            <div className="px-6 pb-6 pt-5">
              <InquiryForm
                villaSlug={villa.slug}
                villaName={villa.name}
                unitLabel={isHotel ? "Room" : isHostel ? "Bed" : undefined}
              />
            </div>
            <div className="border-t border-border/60 px-6 py-4">
              <ConnectWithHost />
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="container-page !max-w-[88rem] mt-24">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">More in {state?.name}</h2>
          <ScrollSlider className="mt-8 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-5 px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:scroll-pl-6 sm:px-6 sm:-mx-6 lg:scroll-pl-8 lg:px-8 lg:-mx-8">
            {similar.map((v) => (
              <div
                key={v.slug}
                className="w-[78vw] shrink-0 snap-start sm:w-[44vw] lg:w-[calc((100%-2.5rem)/3)]"
              >
                <VillaCard
                  villa={v}
                  loggedIn={!!user}
                  inWishlist={wishlistSet.has(v.slug)}
                />
              </div>
            ))}
          </ScrollSlider>
        </section>
      )}

      {/* Mobile-only sticky bottom bar with price + Enquire CTA */}
      <MobileInquireBar
        villaSlug={villa.slug}
        villaName={villa.name}
        pricePerNight={displayPrice}
        unitLabel={isHotel ? "Room" : isHostel ? "Bed" : undefined}
      />
    </div>
  );
}

export default async function VillaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const villa = getVillaBySlug(slug);
  // Hotels & hostels live at their own canonical URLs — send legacy /villas
  // hits there (301-style) so old links keep working without duplicate content.
  if (villa && (villa.type === "hotel" || villa.type === "hostel")) {
    permanentRedirect(propertyPath(villa));
  }
  return <PropertyDetail slug={slug} />;
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

function Fact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2 text-sm font-medium text-foreground md:gap-2.5 md:px-5 md:py-3 md:text-base">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
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
