"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ArrowRight,
  Home,
  Building2,
  Hotel,
  BedDouble,
  PawPrint,
  Users,
  MapPin,
  Waves,
  Umbrella,
  CalendarRange,
  Leaf,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

type StayLink = { label: string; href: string; icon: LucideIcon };
type StayColumn = {
  heading: string;
  links: StayLink[];
  footer?: { label: string; href: string };
};

/** Single source of truth for the Stay mega-menu. Every href points at a
 *  real route (villas / apartments / collections / locations). */
export const STAY_COLUMNS: StayColumn[] = [
  {
    heading: "Explore Stays",
    links: [
      { label: "Luxury Villas", href: "/villas", icon: Home },
      { label: "Apartments", href: "/apartments", icon: Building2 },
      { label: "Hotels", href: "/hotels", icon: Hotel },
      { label: "Hostels", href: "/hostels", icon: BedDouble },
      { label: "Pet-Friendly", href: "/collections/pet-friendly", icon: PawPrint },
      { label: "For Large Groups", href: "/collections/for-large-groups", icon: Users },
    ],
    footer: { label: "All stays", href: "/villas" },
  },
  {
    heading: "By Destination",
    links: [
      { label: "Goa", href: "/locations/goa", icon: MapPin },
      { label: "Maharashtra", href: "/locations/maharashtra", icon: MapPin },
      { label: "Himachal", href: "/locations/himachal-pradesh", icon: MapPin },
      { label: "Rajasthan", href: "/locations/rajasthan", icon: MapPin },
    ],
    footer: { label: "All destinations", href: "/locations" },
  },
  {
    heading: "By Style",
    links: [
      { label: "Pool Villas", href: "/collections/pool-villas", icon: Waves },
      { label: "Beachfront", href: "/collections/beachfront", icon: Umbrella },
      { label: "Weekend Escapes", href: "/collections/weekend-escapes", icon: CalendarRange },
    ],
    footer: { label: "All collections", href: "/collections" },
  },
  {
    heading: "More",
    links: [
      { label: "Why Earthy Stays", href: "/about", icon: Leaf },
      { label: "Owner Benefits", href: "/partner", icon: Handshake },
    ],
  },
];

/** Flattened list for the mobile drawer's Stay section. */
export const STAY_MOBILE_LINKS: { label: string; href: string }[] = [
  { label: "Luxury Villas", href: "/villas" },
  { label: "Apartments", href: "/apartments" },
  { label: "Pool Villas", href: "/collections/pool-villas" },
  { label: "Beachfront", href: "/collections/beachfront" },
  { label: "Pet-Friendly", href: "/collections/pet-friendly" },
  { label: "All destinations", href: "/locations" },
];

export function StayMenu({
  isOverlay,
  showHotels = false,
  showHostels = false,
}: {
  isOverlay: boolean;
  showHotels?: boolean;
  showHostels?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Drop the Hotels / Hostels links until at least one such property is live.
  const columns = STAY_COLUMNS.map((col) => ({
    ...col,
    links: col.links.filter(
      (l) =>
        (l.href !== "/hotels" || showHotels) &&
        (l.href !== "/hostels" || showHostels),
    ),
  }));
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={`group inline-flex items-center gap-1.5 text-base transition-colors lg:text-lg ${
          isOverlay
            ? "text-white/95 hover:text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Stay
        <ChevronDown className="h-4 w-4 transition-transform group-data-[popup-open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={12}
        className="w-[min(1040px,calc(100vw-2rem))] rounded-[18px] border border-border/50 p-8 px-10 shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
      >
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 md:grid-cols-4">
          {columns.map((col, i) => (
            <div
              key={col.heading}
              className={i > 0 ? "md:border-l md:border-[#F1F1F1] md:pl-12" : ""}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-1">
                {col.links.map((l) => {
                  const Icon = l.icon;
                  return (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="group/link relative flex items-center gap-3 rounded-md py-2 pl-3 text-[15px] text-foreground transition-colors before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:bg-primary before:opacity-0 before:transition-opacity hover:text-primary hover:before:opacity-100"
                      >
                        <Icon
                          className="h-5 w-5 shrink-0 text-primary"
                          strokeWidth={1.5}
                        />
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {col.footer && (
                <Link
                  href={col.footer.href}
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-flex items-center gap-1.5 pl-3 text-sm font-medium text-terracotta transition-colors hover:text-terracotta/80"
                >
                  {col.footer.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
