"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { VillaFiltersSidebar } from "@/components/villa-filters-sidebar";

/**
 * Mobile-only "Filters" button that opens the full filters panel in a
 * slide-out sheet. On desktop the sidebar lives in its own column —
 * this component renders `lg:hidden` so it only shows on phones/tablets.
 */
export function MobileFiltersDrawer({
  amenities,
  destinations,
  priceMin,
  priceMax,
  alwaysVisible = false,
}: {
  amenities: string[];
  destinations: Array<{ slug: string; name: string }>;
  priceMin: number;
  priceMax: number;
  /** Show the trigger on desktop too (pages without a sidebar column). */
  alwaysVisible?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted ${
              alwaysVisible ? "" : "lg:hidden"
            }`}
          />
        }
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full overflow-y-auto sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>Filter villas</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6 pt-2">
          <VillaFiltersSidebar
            amenities={amenities}
            destinations={destinations}
            priceMin={priceMin}
            priceMax={priceMax}
            defaultExpanded={false}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
