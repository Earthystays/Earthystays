"use client";

import { useState } from "react";
import Image from "next/image";
import { Users, BedDouble, Ruler, Minus, Plus, Check } from "lucide-react";
import { formatNight } from "@/lib/format";
import { unitAvailableCount } from "@/lib/data/units";
import type { AccommodationUnit, PropertyType } from "@/lib/types";

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
}: {
  unit: AccommodationUnit;
  propertyType: PropertyType;
  /** Optional selection hook. When provided the CTA becomes a button that
   *  calls this instead of scrolling to the inquiry rail (Phase F: opens the
   *  bed-selection grid for selectable dorms). */
  onSelect?: (unitId: string, qty: number) => void;
  /** Overrides the default "Select Room/Bed" CTA text. */
  ctaLabel?: string;
}) {
  const isHostel = propertyType === "hostel";
  const noun = isHostel ? "Bed" : "Room";
  const available = unitAvailableCount(unit);
  const soldOut = available <= 0;

  const [qty, setQty] = useState(1);
  const cap = Math.max(1, available);
  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(cap, q + 1));

  const cover = unit.images?.[0];
  const amenities = unit.amenities ?? [];
  const shownAmenities = amenities.slice(0, 4);
  const extraAmenities = amenities.length - shownAmenities.length;

  const facts: string[] = [
    `${unit.maxGuests} ${unit.maxGuests === 1 ? "Guest" : "Guests"}`,
    unit.bedConfiguration || "",
    unit.size || "",
  ].filter(Boolean);

  return (
    <div className="grid gap-4 rounded-2xl border border-border/70 bg-card p-4 sm:grid-cols-[220px_1fr] lg:grid-cols-[220px_1fr_220px]">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-auto sm:h-full sm:min-h-[150px]">
        {cover ? (
          <Image
            src={cover.src}
            alt={cover.alt || unit.name}
            fill
            sizes="220px"
            className="object-cover"
          />
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
          </div>
        )}
      </div>
    </div>
  );
}
