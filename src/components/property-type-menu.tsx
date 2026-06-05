"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { CityIndexState } from "@/lib/data/villas";

/**
 * Header dropdown for "Villas" / "Apartments" tabs.
 * Shows: All link + dynamic list of "{label} in {City}" rows
 * for every state→city that has at least one property of that type.
 *
 * If no cities exist yet (empty data), renders a plain link instead of
 * an empty dropdown.
 */
export function PropertyTypeMenu({
  label,
  href,
  states,
  isOverlay,
}: {
  label: string; // "Villas" | "Apartments"
  href: string; // "/villas" | "/apartments"
  states: CityIndexState[];
  isOverlay: boolean;
}) {
  const router = useRouter();

  const linkClass = `inline-flex items-center gap-1 text-base lg:text-lg transition-colors ${
    isOverlay
      ? "text-white/95 hover:text-white"
      : "text-muted-foreground hover:text-foreground"
  }`;

  // No data → plain link
  if (states.length === 0) {
    return (
      <a href={href} className={linkClass}>
        {label}
      </a>
    );
  }

  const singular = label.replace(/s$/, ""); // "Villa" / "Apartment"

  // Flatten state→city groups into a single alphabetical city list
  const allCities = states
    .flatMap((s) =>
      s.cities.map((c) => ({
        key: `${s.stateSlug}/${c.slug}`,
        href: `${href}?state=${s.stateSlug}&city=${c.slug}`,
        name: c.name,
      })),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`${linkClass} group`}>
        {label}
        <ChevronDown className="h-4 w-4 transition-transform group-data-[popup-open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={10}
        className="!w-auto !min-w-[260px] max-w-[520px] p-2"
      >
        <DropdownMenuItem
          onClick={() => router.push(href)}
          className="rounded-md px-3 py-2 text-sm font-semibold text-foreground"
        >
          All {label.toLowerCase()}
        </DropdownMenuItem>

        <div className="mt-1 grid gap-y-0.5">
          {allCities.map((c) => (
            <DropdownMenuItem
              key={c.key}
              onClick={() => router.push(c.href)}
              className="rounded-md px-3 py-2 text-sm font-semibold text-foreground"
            >
              {singular}s in {c.name}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
