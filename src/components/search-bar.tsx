"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, Home } from "lucide-react";
import { CallbackModal } from "@/components/callback-modal";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Destination } from "@/lib/types";
import { SingleDatePicker } from "@/components/single-date-picker";
import { GuestsPicker, DEFAULT_GUESTS, type Guests } from "@/components/guests-picker";

type DateRange = { from?: Date; to?: Date };

export type SearchVilla = {
  slug: string;
  name: string;
  city?: string;
  /** Display name for the state, e.g. "Goa". */
  state?: string;
  /** URL slug for the state — required to build /villas?state= links. */
  stateSlug?: string;
};

type DestSuggestion = {
  kind: "destination";
  slug: string;
  name: string;
  region: string;
};
type CitySuggestion = {
  kind: "city";
  citySlug: string;
  cityName: string;
  stateSlug: string;
  stateName: string;
  count: number;
};
type VillaSuggestion = {
  kind: "villa";
  slug: string;
  name: string;
  loc: string;
};
type Suggestion = DestSuggestion | CitySuggestion | VillaSuggestion;

function slugifyCity(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toISO(d: Date | undefined): string | undefined {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type PickedPlace =
  | { kind: "destination"; slug: string; label: string }
  | {
      kind: "city";
      stateSlug: string;
      citySlug: string;
      label: string;
    }
  | null;

function buildParams({
  place,
  range,
  guests,
}: {
  place: PickedPlace;
  range: DateRange | undefined;
  guests: Guests;
}) {
  const params = new URLSearchParams();
  if (place?.kind === "destination") {
    params.set("destination", place.slug);
  } else if (place?.kind === "city") {
    params.set("state", place.stateSlug);
    params.set("city", place.citySlug);
  }
  const checkIn = toISO(range?.from);
  const checkOut = toISO(range?.to);
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (guests.adults !== DEFAULT_GUESTS.adults) params.set("adults", String(guests.adults));
  if (guests.children > 0) params.set("children", String(guests.children));
  if (guests.infants > 0) params.set("infants", String(guests.infants));
  if (guests.rooms !== DEFAULT_GUESTS.rooms) params.set("rooms", String(guests.rooms));
  const total = guests.adults + guests.children;
  if (total > 0) params.set("guests", String(total));
  return params;
}

export function SearchBar({
  destinations,
  villas = [],
}: {
  destinations: Destination[];
  villas?: SearchVilla[];
}) {
  const router = useRouter();
  const [place, setPlace] = useState<PickedPlace>(null);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState<Guests>(DEFAULT_GUESTS);
  const [sheetOpen, setSheetOpen] = useState(false);

  function go(g: Guests = guests) {
    const params = buildParams({ place, range, guests: g });
    setSheetOpen(false);
    router.push(`/villas${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    go();
  }

  function pickDestination(slug: string, label: string) {
    setPlace({ kind: "destination", slug, label });
  }

  function pickCity(stateSlug: string, citySlug: string, label: string) {
    setPlace({ kind: "city", stateSlug, citySlug, label });
  }

  function pickVilla(slug: string) {
    setSheetOpen(false);
    router.push(`/villas/${slug}`);
  }

  return (
    <div className="container-page">
      {/* MOBILE — slim pill trigger opens the search sheet */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex w-full items-center gap-3 rounded-full border border-border bg-card px-5 py-4 text-left shadow-xl transition-colors hover:bg-muted/40 md:hidden"
        aria-label="Open search"
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-[15px] text-muted-foreground">
          Search villas, apartments, locations…
        </span>
      </button>

      {/* DESKTOP — inline horizontal card */}
      <div className="hidden overflow-visible rounded-2xl border border-border/60 bg-card shadow-2xl md:block">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 divide-y divide-border/60 md:grid-cols-[1.5fr_1fr_1fr_1.1fr_auto] md:divide-x md:divide-y-0"
        >
          <SearchCombobox
            destinations={destinations}
            villas={villas}
            value={place?.label ?? ""}
            onPickDestination={pickDestination}
            onPickCity={pickCity}
            onPickVilla={pickVilla}
          />
          <SingleDatePicker
            label="Check-in"
            value={range?.from}
            onChange={(d) =>
              setRange((r) => ({
                from: d,
                to: r?.to && d && r.to <= d ? undefined : r?.to,
              }))
            }
          />
          <SingleDatePicker
            label="Check-out"
            value={range?.to}
            minDate={
              range?.from
                ? new Date(range.from.getTime() + 24 * 60 * 60 * 1000)
                : undefined
            }
            onChange={(d) => setRange((r) => ({ ...r, to: d }))}
          />
          <GuestsPicker
            value={guests}
            onChange={setGuests}
            onApplyAndSearch={(g) => go(g)}
          />
          <Button
            type="submit"
            className="h-14 rounded-none px-10 text-base font-semibold uppercase tracking-[0.15em] md:h-auto"
          >
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </form>

        <div className="flex flex-col items-start gap-2 border-t border-border/60 bg-secondary/40 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            Finding your ideal stay should be easy — we&apos;re here to help.
          </p>
          <CallbackModal />
        </div>
      </div>

      {/* MOBILE SHEET — full search form */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[100dvh] flex-col overflow-y-auto p-0"
        >
          <SheetHeader className="sticky top-0 z-10 border-b border-border/60 bg-background px-5 py-4">
            <SheetTitle className="font-display text-xl font-bold tracking-tight">
              Search your stay
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={submit} className="flex-1 px-5 py-5">
            <div className="grid grid-cols-1 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
              <SearchCombobox
                destinations={destinations}
                villas={villas}
                value={place?.label ?? ""}
                onPickDestination={pickDestination}
                onPickCity={pickCity}
                onPickVilla={pickVilla}
              />
              <div className="grid grid-cols-2 divide-x divide-border/60">
                <SingleDatePicker
                  label="Check-in"
                  value={range?.from}
                  onChange={(d) =>
                    setRange((r) => ({
                      from: d,
                      to: r?.to && d && r.to <= d ? undefined : r?.to,
                    }))
                  }
                />
                <SingleDatePicker
                  label="Check-out"
                  value={range?.to}
                  minDate={
                    range?.from
                      ? new Date(range.from.getTime() + 24 * 60 * 60 * 1000)
                      : undefined
                  }
                  onChange={(d) => setRange((r) => ({ ...r, to: d }))}
                />
              </div>
              <GuestsPicker
                value={guests}
                onChange={setGuests}
                onApplyAndSearch={(g) => go(g)}
              />
            </div>

            <Button
              type="submit"
              className="mt-5 h-14 w-full rounded-md text-base font-semibold uppercase tracking-[0.12em]"
            >
              <Search className="mr-2 h-4 w-4" />
              Search Stays
            </Button>
          </form>

          <div className="mt-auto flex flex-col items-center gap-2 border-t border-border/60 bg-secondary/40 px-5 py-5 text-center text-sm">
            <p className="inline-flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Finding your ideal vacation spot should be easy — we&apos;re here to help.
            </p>
            <CallbackModal />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Typeahead for the location/villa field. Lets the guest type a villa
 * name, a city, or a destination. Selecting a villa navigates straight
 * to that villa's page; selecting a destination filters the listing.
 */
function SearchCombobox({
  destinations,
  villas,
  value,
  onPickDestination,
  onPickCity,
  onPickVilla,
}: {
  destinations: Destination[];
  villas: SearchVilla[];
  value: string;
  onPickDestination: (slug: string, label: string) => void;
  onPickCity: (stateSlug: string, citySlug: string, label: string) => void;
  onPickVilla: (slug: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync local input from externally-controlled value
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Derive unique cities from the villa list. Each city remembers its
  // parent state so picking it produces a /villas?state=&city= link.
  const cityItems: CitySuggestion[] = useMemo(() => {
    const map = new Map<string, CitySuggestion>();
    for (const v of villas) {
      if (!v.city || !v.stateSlug) continue;
      const cityName = v.city.trim();
      if (!cityName) continue;
      const citySlug = slugifyCity(cityName);
      const key = `${v.stateSlug}/${citySlug}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          kind: "city",
          citySlug,
          cityName,
          stateSlug: v.stateSlug,
          stateName: v.state ?? "",
          count: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) =>
      b.count - a.count || a.cityName.localeCompare(b.cityName),
    );
  }, [villas]);

  const suggestions: Suggestion[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const destItems: DestSuggestion[] = destinations.map((d) => ({
      kind: "destination",
      slug: d.slug,
      name: d.name,
      region: d.region,
    }));
    const villaItems: VillaSuggestion[] = villas.map((v) => ({
      kind: "villa",
      slug: v.slug,
      name: v.name,
      loc: [v.city, v.state].filter(Boolean).join(", "),
    }));

    if (!q) {
      // No query — quick-picks: top cities (where most stock lives)
      // followed by destinations.
      return [...cityItems.slice(0, 4), ...destItems.slice(0, 4)];
    }

    const matchingCities = cityItems.filter(
      (c) =>
        c.cityName.toLowerCase().includes(q) ||
        c.stateName.toLowerCase().includes(q),
    );
    const matchingDests = destItems.filter(
      (d) =>
        d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q),
    );
    const matchingVillas = villaItems.filter(
      (v) => v.name.toLowerCase().includes(q) || v.loc.toLowerCase().includes(q),
    );

    return [
      ...matchingCities.slice(0, 4),
      ...matchingDests.slice(0, 3),
      ...matchingVillas.slice(0, 6),
    ];
  }, [query, destinations, villas, cityItems]);

  function choose(s: Suggestion) {
    if (s.kind === "destination") {
      onPickDestination(s.slug, s.name);
      setQuery(s.name);
      setOpen(false);
    } else if (s.kind === "city") {
      const label = `${s.cityName}${s.stateName ? `, ${s.stateName}` : ""}`;
      onPickCity(s.stateSlug, s.citySlug, label);
      setQuery(label);
      setOpen(false);
    } else {
      setOpen(false);
      onPickVilla(s.slug);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && suggestions[activeIdx]) {
      e.preventDefault();
      choose(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <label
      ref={wrapRef}
      className="relative block px-5 py-3.5 transition-colors hover:bg-muted/30"
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Location / Villas / Landmark
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIdx(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="Where to? Try a villa name or city…"
        className="mt-1 w-full border-0 bg-transparent p-0 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-border/60 bg-card p-1.5 shadow-2xl sm:left-3 sm:right-3">
          {suggestions.map((s, i) => {
            const key =
              s.kind === "city"
                ? `city-${s.stateSlug}-${s.citySlug}`
                : `${s.kind}-${s.slug}`;
            return (
              <button
                key={key}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(s);
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  i === activeIdx ? "bg-muted/60" : "hover:bg-muted/40"
                }`}
              >
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                  {s.kind === "villa" ? (
                    <Home className="h-3.5 w-3.5" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {s.kind === "city" ? s.cityName : s.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.kind === "destination" && `Destination · ${s.region}`}
                    {s.kind === "city" &&
                      `City${s.stateName ? ` · ${s.stateName}` : ""} · ${s.count} ${
                        s.count === 1 ? "stay" : "stays"
                      }`}
                    {s.kind === "villa" && `Villa${s.loc ? ` · ${s.loc}` : ""}`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {open && suggestions.length === 0 && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground shadow-2xl sm:left-3 sm:right-3">
          No matches for &ldquo;{query}&rdquo;. Try a city or destination
          name.
        </div>
      )}
    </label>
  );
}
