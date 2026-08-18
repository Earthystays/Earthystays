import Link from "next/link";
import Image from "next/image";
import {
  Star,
  MapPin,
  Users,
  BedDouble,
  Bath,
  ArrowRight,
  Quote,
  Sparkles,
  Camera,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import type { Villa } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { getAmenityIcon } from "@/lib/amenity-icons";
import { PhotoCarousel } from "@/components/photo-carousel";
import { WishlistButton } from "@/components/wishlist-button";
import { ShareIconButton } from "@/components/share-icon-button";

/** Heuristic for "Best Rated" badge — rating ≥ 4.7 with 20+ reviews. */
function isBestRated(villa: Villa): boolean {
  return villa.rating >= 4.7 && villa.reviewCount >= 20;
}

/** "Luxury" tier — top-end nightly rate. */
function isLuxury(villa: Villa): boolean {
  return villa.pricePerNight >= 25000;
}

/** One-line editorial voice for featured cards — deterministic per villa. */
const EDITORIAL_QUOTES = [
  "One of our favourite villas for family holidays.",
  "Handpicked by our hospitality team.",
  "A hidden gem with unforgettable sunset views.",
  "The kind of stay our team books for their own holidays.",
  "A guest favourite, season after season.",
];

function editorialQuote(slug: string): string {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return EDITORIAL_QUOTES[h % EDITORIAL_QUOTES.length];
}

/** Prettify a collection slug for the "Great for:" chip row. */
function collectionLabel(slug: string): string {
  const special: Record<string, string> = {
    "for-large-groups": "Large Groups",
    "pool-villas": "Pool Villas",
  };
  return (
    special[slug] ??
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

function hasBreakfast(villa: Villa): boolean {
  const preset = villa.meals?.preset;
  if (preset === "breakfast" || preset === "all-meals" || preset === "chef-included")
    return true;
  return villa.amenities.some((a) => /breakfast/i.test(a));
}

/**
 * Earthy Stays listing card — owner's design system (2026-07-23) at the
 * live site's compact scale. Cormorant Garamond for the property name
 * only; Manrope for everything else (all numbers included).
 *
 * Desktop (lg+): 38% image / 42% details / 20% price rail, 24px radius.
 * Tablet (md): 40/60 with the price rail as a row below. Mobile: single
 * column, 260px hero, horizontal amenity scroll, full-width bottom CTA.
 *
 * `recommended` = the rare Featured Villa editorial treatment at
 * identical dimensions; the page decides which few cards get it.
 */
export function VillaListItem({
  villa,
  loggedIn = false,
  inWishlist = false,
  recommended = false,
  index = 0,
}: {
  villa: Villa;
  loggedIn?: boolean;
  inWishlist?: boolean;
  recommended?: boolean;
  /** Position in the list — staggers the scroll-reveal cascade 40ms apart. */
  index?: number;
}) {
  const fx = recommended;
  const amenityCount = fx ? 7 : 5;
  const visibleAmenities = villa.amenities.slice(0, amenityCount);
  const remaining = Math.max(0, villa.amenities.length - amenityCount);
  const bestRated = isBestRated(villa);
  const luxury = isLuxury(villa);
  const breakfast = hasBreakfast(villa);
  const href = `/villas/${villa.slug}`;
  const thumbs = fx ? villa.images.slice(1, 5) : [];
  const extraPhotos = Math.max(0, villa.images.length - 5);

  const mutedText = fx ? "text-white/65" : "text-[#666666]";

  return (
    <Reveal index={index}>
    <article
      className={`group font-manrope relative grid cursor-pointer grid-cols-1 overflow-hidden rounded-[20px] transition-[transform,box-shadow] duration-[250ms] ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:grid-cols-[40fr_60fr] lg:grid-cols-[38fr_42fr_20fr] lg:rounded-[24px] ${
        fx
          ? "bg-forest-deep text-white shadow-[0_0_0_1px_rgba(212,166,77,0.35),0_10px_40px_-14px_rgba(212,166,77,0.4)] hover:shadow-[0_0_0_1px_rgba(212,166,77,0.55),0_18px_50px_-14px_rgba(212,166,77,0.5)]"
          : "border border-[#ECE7E2] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.12)]"
      }`}
    >
      {/* ============ IMAGE (38%) ============ */}
      <div className="flex flex-col">
        <Link
          href={href}
          className="relative block h-[230px] overflow-hidden bg-muted md:h-full md:min-h-[220px] md:flex-1 lg:min-h-[340px]"
        >
          <div className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <PhotoCarousel
              images={villa.images}
              sizes="(min-width: 1024px) 640px, 100vw"
              counterStyle="text"
            />
          </div>

          {/* Cinematic hover — soft gradient + photo-count invite (fades in 200ms) */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-2/5 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-hidden
          />
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex translate-y-1 items-center gap-1.5 rounded-md bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none">
            <Camera className="h-3 w-3" strokeWidth={1.8} />
            View {villa.images.length} Photos
          </span>

          {/* TOP LEFT — badges: h34, 13px/600, radius 12, gap 8 */}
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            {fx ? (
              <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-gold px-2.5 text-[11px] font-semibold text-forest-deep shadow-md">
                <Star className="h-3 w-3 fill-forest-deep text-forest-deep" />
                Featured Villa
              </span>
            ) : (
              <>
                {bestRated && (
                  <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-white px-2.5 text-[11px] font-semibold text-[#222222] shadow-sm">
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    Best Rated
                  </span>
                )}
                {luxury && (
                  <span className="inline-flex h-7 items-center rounded-lg bg-[#2F4A3A] px-2.5 text-[11px] font-semibold text-white shadow-sm">
                    Luxury
                  </span>
                )}
              </>
            )}
          </div>

          {/* TOP RIGHT — wishlist + share: 48px circles, 12px gap */}
          <div className="absolute right-4 top-4 z-10 flex flex-col gap-3">
            <WishlistButton
              slug={villa.slug}
              loggedIn={loggedIn}
              initialActive={inWishlist}
            />
            <ShareIconButton slug={villa.slug} villaName={villa.name} />
          </div>
          {/* BOTTOM LEFT — "1 / 5" counter rendered by PhotoCarousel */}
        </Link>

        {/* Thumbnail strip — featured cards only */}
        {fx && thumbs.length > 0 && (
          <div className="flex gap-2 p-3">
            {thumbs.map((img) => (
              <Link
                key={img.src}
                href={href}
                className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-white/15"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </Link>
            ))}
            {extraPhotos > 0 && (
              <Link
                href={href}
                className="flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[11px] font-semibold leading-tight text-white"
              >
                <span>+{extraPhotos}</span>
                <span>Photos</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ============ DETAILS (42%) — padding 36, space-between ============ */}
      <div
        className={`flex min-w-0 flex-col p-4 sm:p-5 lg:p-7 ${
          fx ? "justify-between" : "justify-center lg:justify-start"
        }`}
      >
        <div>
          {/* Name — Manrope 600, titles only; mobile shows rating beside it */}
          <div className="flex items-start justify-between gap-3">
            <Link href={href} className="min-w-0">
              <h3
                className={`font-title text-[23px] font-semibold leading-[1.05] tracking-[-0.5px] transition-colors lg:text-[30px] ${
                  fx ? "text-white hover:text-gold" : "text-[#1E1E1E] hover:text-terracotta"
                }`}
              >
                {villa.name}
              </h3>
            </Link>
            {villa.reviewCount > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 pt-2 lg:hidden">
                <Star className="h-4 w-4 fill-gold text-gold" />
                <span className="text-sm font-semibold tabular-nums">
                  {villa.rating.toFixed(1)}
                </span>
              </span>
            )}
          </div>

          {/* Location — 18px, #6B6B6B, mt 12 */}
          <div
            className={`mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium leading-[1.5] lg:mt-2.5 lg:text-[15px] ${
              fx ? "text-white/65" : "text-[#6B6B6B]"
            }`}
          >
            <MapPin className={`h-4 w-4 shrink-0 ${fx ? "text-gold" : ""}`} strokeWidth={1.6} />
            <span className="truncate">
              {villa.city ? `${villa.city}, ` : ""}
              {villa.state}
            </span>
          </div>

          {/* Stats — 17px medium #555, icons 18, gap 24, mt 20 */}
          {fx ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-y-1 text-[13px] text-white/90">
              {[
                `Up to ${villa.maxGuests} Guests`,
                `${villa.bedrooms} Bedrooms`,
                `${villa.bathrooms} Bathrooms`,
              ].map((label, i, arr) => (
                <span key={label} className="inline-flex items-center whitespace-nowrap font-medium">
                  {label}
                  {i < arr.length - 1 && <span className="mx-3 text-gold">•</span>}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] font-semibold text-[#444444] lg:mt-4 lg:text-[14.5px]">
              {(
                [
                  { Icon: Users, label: `Up to ${villa.maxGuests} Guests` },
                  { Icon: BedDouble, label: `${villa.bedrooms} Bedrooms` },
                  { Icon: Bath, label: `${villa.bathrooms} Bathrooms` },
                ] as const
              ).map((s) => (
                <span key={s.label} className="inline-flex items-center gap-2 whitespace-nowrap">
                  <s.Icon className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={1.6} />
                  {s.label}
                </span>
              ))}
            </div>
          )}

          {/* Highlight box — bg #F6F2ED, radius 12, padding 14/18, mt 22 */}
          {!fx && villa.collections.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-[#F7F3EE] px-3 py-2 transition-colors duration-[180ms] hover:bg-[#F2EDE5] lg:mt-5">
              <span className="text-xs text-[#6B6B6B]">Great for:</span>
              {villa.collections.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#444444] transition-colors duration-[180ms] hover:text-[#2F4A3A]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#999999]" strokeWidth={1.6} />
                  {collectionLabel(c)}
                </span>
              ))}
            </div>
          )}

          {/* Amenities — mt 28, gap 22, circle 48, icon 20, label 12 #666 */}
          {visibleAmenities.length > 0 && (
            <div
              className={
                fx
                  ? "mt-3 grid grid-cols-4 gap-x-2 gap-y-2"
                  : "mt-3 flex items-start gap-x-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mt-5 lg:pb-0"
              }
            >
              {visibleAmenities.map((a) => {
                const Icon = getAmenityIcon(a);
                return (
                  <div
                    key={a}
                    className={`group/am flex flex-col items-center text-center ${fx ? "" : "w-11 shrink-0"}`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center border transition-[transform,border-color,background-color] duration-200 motion-reduce:transition-none lg:h-11 lg:w-11 ${
                        fx
                          ? "rounded-xl border-gold/40 bg-white/5"
                          : "rounded-full border-[#ECE7E2] bg-white group-hover/am:-translate-y-0.5 group-hover/am:border-[#2F4A3A] group-hover/am:bg-[#F5F8F6]"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 transition-colors duration-200 lg:h-5 lg:w-5 ${fx ? "text-gold" : "text-[#444444] group-hover/am:text-[#2F4A3A]"}`}
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className={`mt-1 block min-h-[2.4em] text-[10px] font-medium leading-tight line-clamp-2 lg:text-[12px] ${fx ? "text-white/65" : "text-[#666666]"}`}>
                      {a}
                    </span>
                  </div>
                );
              })}
              {remaining > 0 && (
                <div className={`flex flex-col items-center text-center ${fx ? "" : "w-11 shrink-0"}`}>
                  <div
                    className={`flex h-9 w-9 items-center justify-center border text-xs font-semibold ${
                      fx
                        ? "rounded-xl border-gold/40 bg-white/5 text-gold"
                        : "rounded-full border-[#ECE7E2] bg-white text-[#444444]"
                    }`}
                  >
                    {remaining}+
                  </div>
                  <span className={`mt-1 block text-[10px] font-medium leading-tight ${fx ? "text-white/65" : "text-[#666666]"}`}>More</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description + "Read more" removed for the standard card per owner
            request — kept only for the featured/editorial treatment below. */}
        {fx && (
          <div>
            <div className="mt-3 flex items-start gap-2">
              <Quote className="h-4 w-4 shrink-0 rotate-180 fill-gold text-gold" />
              <p className="line-clamp-1 text-[13px] italic leading-snug text-white/90">
                {editorialQuote(villa.slug)}
              </p>
            </div>
            <Link
              href={href}
              className="group/rm mt-2 inline-flex items-center gap-1 text-[12.5px] font-bold text-gold underline-offset-4 transition-colors duration-[180ms] hover:text-white hover:underline"
            >
              Read more
              <ArrowRight className="h-4 w-4 transition-transform duration-[180ms] group-hover/rm:translate-x-1.5 motion-reduce:transition-none" />
            </Link>
          </div>
        )}
      </div>

      {/* ============ PRICE RAIL (20%) — padding 36, space-between ============ */}
      <div
        className={`flex flex-col md:col-span-2 lg:col-span-1 ${
          fx
            ? "p-3"
            : "border-t border-[#F2F2F2] bg-[#F7F5F1] p-4 lg:border-l lg:border-t-0"
        }`}
      >
        <div
          className={`flex flex-col ${
            fx ? "h-full rounded-2xl border border-gold/40 p-5 lg:p-6" : "lg:h-full"
          } lg:items-center lg:justify-start lg:gap-4 lg:text-center`}
        >
          {/* Rating — ★★★★★ gold + count grey (desktop only; mobile beside name) */}
          {villa.reviewCount > 0 && (
            <div className="hidden lg:block lg:text-center">
              <div className="inline-flex items-center gap-0.5 transition-[filter] duration-200 hover:brightness-110">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 lg:h-3.5 lg:w-3.5 ${
                      i < Math.round(villa.rating)
                        ? "fill-gold text-gold"
                        : fx
                          ? "text-white/25"
                          : "text-[#ECE7E2]"
                    }`}
                  />
                ))}
              </div>
              <p className={`mt-1 text-[14px] font-bold leading-none lg:text-[15px] ${fx ? "text-white" : "text-[#1E1E1E]"}`}>
                {villa.rating.toFixed(1)}
              </p>
              <p className={`mt-0.5 text-[11px] lg:text-[12px] ${fx ? "text-white/65" : "text-[#777777]"}`}>
                {villa.reviewCount} Reviews
              </p>
            </div>
          )}

          {/* Price + chips. Mobile: price left, chip right. Desktop: stacked centre. */}
          <div className="flex w-full items-center justify-between gap-3 lg:flex-col lg:justify-start lg:gap-4">
            <div>
              <p
                className={`text-[23px] font-extrabold leading-none tracking-[-0.5px] lg:mt-2 lg:text-[30px] ${
                  fx ? "text-[#F2E8CE]" : "text-[#1E1E1E]"
                }`}
              >
                {formatINR(villa.pricePerNight)}
              </p>
              <p className={`mt-1 text-[11px] font-medium lg:text-[12px] ${fx ? "text-white/65" : "text-[#777777]"}`}>
                / night + taxes
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 lg:w-full lg:items-center">
              {/* Room chip — 100% w, h 52, radius 12, 16px medium */}
              <span
                className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold lg:h-11 lg:w-full lg:text-[14px] ${
                  fx
                    ? "bg-gold text-forest-deep"
                    : "border border-[#ECE7E2] bg-white text-[#222222]"
                }`}
              >
                <BedDouble className="h-4 w-4 lg:h-[18px] lg:w-[18px]" strokeWidth={1.6} />
                For {villa.bedrooms} {villa.bedrooms === 1 ? "Room" : "Rooms"}
              </span>
              {breakfast && (
                <span className={`mt-1 text-[11px] ${mutedText}`}>
                  Includes breakfast
                </span>
              )}
            </div>
          </div>

          {/* CTA — 100% w, h 58, radius 14, 18px/600 */}
          <Link
            href={href}
            className={`group/cta mt-3 inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-[14px] font-bold tracking-normal transition-[transform,background-color,box-shadow,filter] duration-[220ms] ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:h-12 lg:text-[16px] ${
              fx
                ? "lg:mt-auto bg-gold text-forest-deep hover:brightness-110 hover:shadow-lg hover:shadow-gold/25"
                : "lg:mt-auto bg-[#2F4A3A] text-white hover:-translate-y-0.5 hover:bg-[#24382D] hover:shadow-[0_10px_24px_rgba(47,74,58,0.25)]"
            }`}
          >
            View Villa
            <ArrowRight className="h-4 w-4 transition-transform duration-[220ms] group-hover/cta:translate-x-1 motion-reduce:transition-none" />
          </Link>
        </div>
      </div>
    </article>
    </Reveal>
  );
}
