"use client";

import { RoomCard } from "@/components/room-card";
import { setUnitSelection } from "@/lib/unit-selection";
import type { AccommodationUnit } from "@/lib/types";

/**
 * Hotel rooms section (Phase G). Renders the room-type cards and records the
 * guest's room + quantity pick into the selection store before scrolling to
 * the inquiry rail.
 */
export function HotelRooms({
  slug,
  units,
}: {
  slug: string;
  units: AccommodationUnit[];
}) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Choose a room that suits your stay.</p>
      {units.map((unit) => (
        <RoomCard
          key={unit.id}
          unit={unit}
          propertyType="hotel"
          onSelect={(unitId, qty) => {
            setUnitSelection({
              slug,
              item: { unitId, unitName: unit.name, quantity: qty, unitPrice: unit.basePrice },
            });
            if (typeof window !== "undefined") window.location.hash = "#inquire";
          }}
        />
      ))}
    </div>
  );
}
