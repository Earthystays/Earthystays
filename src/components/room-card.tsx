"use client";

import { useState } from "react";
import Image from "next/image";
import { Users, BedDouble, Ruler, Minus, Plus, Check, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { formatNight } from "@/lib/format";
import { unitAvailableCount } from "@/lib/data/units";
import { RoomRateStrip } from "@/components/room-rate-strip";
import type { AccommodationUnit, PropertyType } from "@/lib/types";
import type { UnitDateMap } from "@/lib/data/unit-rates";

/**
 * Guest-facing room-type / dorm-type card (Phase E/F). Layout mirrors the
 * mockup: image (left) · info (middle) · price + availability + quantity + CTA
 * (right), collapsing to a stack on mobile. Inquiry-led v1 — the CTA scrolls to
 * the inquiry rail; structured line-items land in a later phase.
 */
export function RoomCard({
  unit,
  propertyType,
  onSelect,
  ctaLabel,
  overrides,
  blocked,
}: {
  unit: AccommodationUnit;
  propertyType: PropertyType;
  /** Optional selection hook. When provided the CTA becomes a button that
   *  calls this instead of scrolling to the inquiry rail (Phase F: opens the
   *  bed-selection grid for selectable dorms). */
  onSelect?: (unitId: string, qty: number) => void;
  /** Overrides the default "Select Room/Bed" CTA text. */
  ctaLabel?: string;
  /** Per-date price/units overrides for the 7-day rate strip (Phase 21). */
  overrides?: UnitDateMap;
  /** Blocked dates for the rate strip. */
  blocked?: string[];
}) {
  const isHostel = propertyType === "hostel";
  const noun = isHostel ? "Bed" : "Room";
  const available = unitAvailableCount(unit);
  const soldOut = available <= 0;

  const [showRates, setShowRates] = useState(false);
  const [qty, setQty] = useState(1);
  const cap = Math.max(1, available);
  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(cap, q + 1));

  const images = unit.images ?? [];
  const [imgIndex, setImgIndex] = useState(0);
  const hasMultiple = images.length > 1;
  const current = images[imgIndex] ?? images[0];
  const prevImg = () =>
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setImgIndex((i) => (i + 1) % images.length);

  const amenities = unit.amenities ?? [];
  const shownAmenities = amenities.slice(0, 4);
  const extraAmenities = amenities.length - shownAmenities.length;

  const facts: string[] = [
    `${unit.maxGuests} ${unit.maxGuests === 1 ? "Guest" : "Guests"}`,
    unit.bedConfiguration || "",
    unit.size || "",
  ].filter(Boolean);

  return (
    <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-4">
    <div className="grid gap-4 sm:grid-cols-[220px_1fr] lg:grid-cols-[220px_1fr_220px]">
      {/* Image */}
      <div className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-auto sm:h-full sm:min-h-[150px]">
        {current ? (
          <>
            <Image
              src={current.src}
              alt={current.alt || unit.name}
              fill
              sizes="220px"
              className="object-cover"
            />
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={prevImg}
                  aria-label="Previous photo"
                  className="absolute left-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:bg-black/60"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextImg}
                  aria-label="Next photo"
                  className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:bg-black/60"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImgIndex(i)}
                      aria-label={`Go to photo ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No photo
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <h3 className="font-title text-lg font-semibold">{unit.name}</h3>
        {facts.length > 0 && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {facts.map((f, i) => (
              <span key={i} className="flex items-center gap-1">
                {i === 0 && <Users className="h-3.5 w-3.5" />}
                {i === 1 && <BedDouble className="h-3.5 w-3.5" />}
                {i === 2 && <Ruler className="h-3.5 w-3.5" />}
                {f}
              </span>
            ))}
          </p>
        )}
        {unit.shortDescription && (
          <p className="mt-2 text-sm text-foreground/80">{unit.shortDescription}</p>
        )}
        {shownAmenities.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {shownAmenities.map((a) => (
              <li key={a} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary/60" /> {a}
              </li>
            ))}
            {extraAmenities > 0 && (
              <li className="text-muted-foreground/80">+{extraAmenities} more</li>
            )}
          </ul>
        )}
      </div>

      {/* Price + availability + CTA */}
      <div className="flex flex-col justify-between gap-3 border-t border-border/60 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <div>
          <p className="font-numeric text-xl font-bold tabular-nums">
            {formatNight(unit.basePrice)}
          </p>
          <p className="text-[11px] text-muted-foreground">Incl. taxes</p>
          <p
            className={`mt-1 text-xs font-medium ${
              soldOut ? "text-destructive" : "text-primary"
            }`}
          >
            {soldOut
              ? "Sold out"
              : `${available} ${noun}${available === 1 ? "" : "s"} Available`}
          </p>
        </div>

        {!soldOut && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-lg border border-border px-2 py-1">
              <button
                type="button"
                onClick={dec}
                disabled={qty <= 1}
                className="grid h-7 w-7 place-items-center rounded-md text-foreground disabled:opacity-40 hover:bg-muted"
                aria-label={`Fewer ${noun.toLowerCase()}s`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm tabular-nums">
                {qty} {noun}
                {qty === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={inc}
                disabled={qty >= cap}
                className="grid h-7 w-7 place-items-center rounded-md text-foreground disabled:opacity-40 hover:bg-muted"
                aria-label={`More ${noun.toLowerCase()}s`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(unit.id, qty)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <Check className="h-4 w-4" /> {ctaLabel ?? `Select ${noun}`}
              </button>
            ) : (
              <a
                href="#inquire"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <Check className="h-4 w-4" /> {ctaLabel ?? `Select ${noun}`}
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowRates((s) => !s)}
              aria-expanded={showRates}
              aria-label={showRates ? "Hide 7-day rates" : "Show 7-day rates"}
              title={showRates ? "Hide 7-day rates" : "Show 7-day rates"}
              className="mx-auto inline-flex items-center justify-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <CalendarDays className="h-4 w-4" />
              {showRates ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>

    {showRates && (
      <RoomRateStrip unit={unit} overrides={overrides} blocked={blocked} noun={noun} />
    )}
    </div>
  );
}
