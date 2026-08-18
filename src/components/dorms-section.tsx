"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Users, BedDouble, Ruler, Check } from "lucide-react";
import { RoomCard } from "@/components/room-card";
import { unitAvailableCount } from "@/lib/data/units";
import { setUnitSelection } from "@/lib/unit-selection";
import type { AccommodationUnit, BedInventory } from "@/lib/types";

function goToInquiry() {
  if (typeof window !== "undefined") window.location.hash = "#inquire";
}

/**
 * Hostel dorms section (Phase F). Shows dorm-type cards; for dorms that let
 * guests choose a bed (`allowUnitSelection`), the CTA opens a bed-selection
 * grid. Dorms set to auto-assign keep the plain "Select Bed" → inquiry flow.
 */
export function DormsSection({
  slug,
  units,
}: {
  slug: string;
  units: AccommodationUnit[];
}) {
  const [selecting, setSelecting] = useState<AccommodationUnit | null>(null);

  if (selecting) {
    return <BedSelection slug={slug} dorm={selecting} onBack={() => setSelecting(null)} />;
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Choose your dorm and bed.</p>
      {units.map((unit) => {
        const selectable =
          unit.allowUnitSelection && (unit.beds?.length ?? 0) > 0;
        return (
          <RoomCard
            key={unit.id}
            unit={unit}
            propertyType="hostel"
            ctaLabel="Select Bed"
            onSelect={(unitId, qty) => {
              if (selectable) {
                setSelecting(unit);
                return;
              }
              // Auto-assign dorm — record the bed count and jump to inquiry.
              setUnitSelection({
                slug,
                item: { unitId, unitName: unit.name, quantity: qty },
              });
              goToInquiry();
            }}
          />
        );
      })}
    </div>
  );
}

const LEGEND: { key: string; label: string; className: string }[] = [
  { key: "available", label: "Available", className: "border-primary/40 bg-primary/5" },
  { key: "selected", label: "Selected", className: "border-primary bg-primary text-primary-foreground" },
  { key: "booked", label: "Booked", className: "border-border bg-muted text-muted-foreground" },
];

function bedIsOpen(bed: BedInventory): boolean {
  return !bed.status || bed.status === "available";
}

function BedSelection({
  slug,
  dorm,
  onBack,
}: {
  slug: string;
  dorm: AccommodationUnit;
  onBack: () => void;
}) {
  const beds = dorm.beds ?? [];
  const cap = unitAvailableCount(dorm);
  const [selected, setSelected] = useState<string[]>([]);

  const facts = useMemo(
    () =>
      [
        `${dorm.maxGuests} ${dorm.maxGuests === 1 ? "Guest" : "Guests"}`,
        dorm.bedConfiguration || "",
        dorm.size || "",
      ].filter(Boolean),
    [dorm],
  );

  function toggle(bedId: string) {
    setSelected((prev) => {
      if (prev.includes(bedId)) return prev.filter((id) => id !== bedId);
      if (prev.length >= cap) return prev; // don't exceed available beds
      return [...prev, bedId];
    });
  }

  return (
    <div className="grid gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dorms
      </button>

      <div>
        <h3 className="font-title text-xl font-semibold">{dorm.name}</h3>
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
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {LEGEND.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5">
            <span className={`h-4 w-4 rounded border ${l.className}`} /> {l.label}
          </span>
        ))}
      </div>

      {/* Bed grid */}
      <div>
        <p className="mb-2 text-sm font-medium">Select Your Bed</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
          {beds.map((bed) => {
            const open = bedIsOpen(bed);
            const isSel = selected.includes(bed.id);
            return (
              <button
                key={bed.id}
                type="button"
                disabled={!open}
                onClick={() => toggle(bed.id)}
                aria-pressed={isSel}
                className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  isSel
                    ? "border-primary bg-primary text-primary-foreground"
                    : open
                      ? "border-primary/40 bg-primary/5 hover:border-primary"
                      : "cursor-not-allowed border-border bg-muted text-muted-foreground"
                }`}
              >
                <span className="flex w-full items-center justify-between font-medium">
                  {bed.label}
                  {isSel && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="text-[11px] opacity-80">
                  {isSel
                    ? "Selected"
                    : open
                      ? `₹${dorm.basePrice.toLocaleString("en-IN")} / night`
                      : "Booked"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => {
            const chosen = beds.filter((b) => selected.includes(b.id));
            setUnitSelection({
              slug,
              item: {
                unitId: dorm.id,
                unitName: dorm.name,
                quantity: chosen.length,
                selectedInventoryIds: chosen.map((b) => b.id),
              },
              bedLabels: chosen.map((b) => b.label),
            });
            goToInquiry();
          }}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium transition ${
            selected.length === 0
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          Continue
          {selected.length > 0 &&
            ` · ${selected.length} bed${selected.length === 1 ? "" : "s"}`}
        </button>
        {selected.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {beds
              .filter((b) => selected.includes(b.id))
              .map((b) => b.label)
              .join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}
