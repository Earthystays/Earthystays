"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Minus,
  Plus,
  ChevronDown,
  RotateCcw,
  Wallet,
  BedDouble,
  Users,
  MapPin,
  Leaf,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const STEP = 1000;

const FEATURED_AMENITIES: Array<{ label: string; value: string }> = [
  { label: "Private pool", value: "Private Pool" },
  { label: "Pet friendly", value: "Pet Friendly" },
  { label: "Mountain view", value: "Mountain View" },
  { label: "Beach access", value: "Beachfront" },
  { label: "Chef", value: "Chef on Call" },
  { label: "Hot tub", value: "Hot Tub" },
];

export function VillaFiltersSidebar({
  amenities,
  destinations,
  priceMin,
  priceMax,
  defaultExpanded = true,
}: {
  amenities: string[];
  destinations: Array<{ slug: string; name: string }>;
  priceMin: number;
  priceMax: number;
  defaultExpanded?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const sliderMin = Math.floor(priceMin / STEP) * STEP;
  const sliderMax = Math.ceil(priceMax / STEP) * STEP;

  const urlMin = Number(sp.get("minPrice") ?? "") || sliderMin;
  const urlMax = Number(sp.get("maxPrice") ?? "") || sliderMax;
  const initialRooms = Number(sp.get("rooms") ?? 0) || 0;
  const initialGuests = Number(sp.get("guests") ?? 0) || 0;
  const initialAmens = sp.getAll("amenity");

  const [range, setRange] = useState<[number, number]>([
    clamp(urlMin, sliderMin, sliderMax),
    clamp(urlMax, sliderMin, sliderMax),
  ]);
  const [minP, setMinP] = useState<string>(String(range[0]));
  const [maxP, setMaxP] = useState<string>(String(range[1]));
  const [rooms, setRooms] = useState<number>(initialRooms);
  const [guests, setGuests] = useState<number>(initialGuests);
  const [selected, setSelected] = useState<string[]>(initialAmens);
  const [showMoreAmenities, setShowMoreAmenities] = useState(false);
  const [openPrice, setOpenPrice] = useState(defaultExpanded);
  const [openAmen, setOpenAmen] = useState(defaultExpanded);
  const [openLoc, setOpenLoc] = useState(defaultExpanded);

  const featured = FEATURED_AMENITIES.filter((f) => amenities.includes(f.value));
  const featuredValues = new Set(featured.map((f) => f.value));
  const moreAmenities = amenities.filter((a) => !featuredValues.has(a));

  function push(mutator: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(sp.toString());
    mutator(next);
    startTransition(() => {
      router.push(`/villas${next.toString() ? `?${next}` : ""}`);
    });
  }

  function pushPrice(lo: number, hi: number) {
    push((p) => {
      if (lo > sliderMin) p.set("minPrice", String(lo));
      else p.delete("minPrice");
      if (hi < sliderMax) p.set("maxPrice", String(hi));
      else p.delete("maxPrice");
    });
  }

  useEffect(() => {
    if (rooms === initialRooms) return;
    push((p) => {
      if (rooms > 0) p.set("rooms", String(rooms));
      else p.delete("rooms");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  useEffect(() => {
    if (guests === initialGuests) return;
    push((p) => {
      if (guests > 0) p.set("guests", String(guests));
      else p.delete("guests");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guests]);

  useEffect(() => {
    if (
      selected.length === initialAmens.length &&
      selected.every((a) => initialAmens.includes(a))
    )
      return;
    push((p) => {
      p.delete("amenity");
      for (const a of selected) p.append("amenity", a);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function onSliderChange(values: number | readonly number[]) {
    const arr = Array.isArray(values) ? values : [values as number, values as number];
    const lo = (arr[0] as number) ?? sliderMin;
    const hi = (arr[1] as number) ?? sliderMax;
    setRange([lo, hi]);
    setMinP(String(lo));
    setMaxP(String(hi));
  }

  function onSliderCommit(values: number | readonly number[]) {
    const arr = Array.isArray(values) ? values : [values as number, values as number];
    pushPrice((arr[0] as number) ?? sliderMin, (arr[1] as number) ?? sliderMax);
  }

  function applyInputs() {
    const lo = clamp(Number(minP) || sliderMin, sliderMin, sliderMax);
    const hi = clamp(Number(maxP) || sliderMax, sliderMin, sliderMax);
    const [nlo, nhi] = lo <= hi ? [lo, hi] : [hi, lo];
    setRange([nlo, nhi]);
    setMinP(String(nlo));
    setMaxP(String(nhi));
    pushPrice(nlo, nhi);
  }

  function clearAll() {
    setMinP(String(sliderMin));
    setMaxP(String(sliderMax));
    setRange([sliderMin, sliderMax]);
    setRooms(0);
    setGuests(0);
    setSelected([]);
    startTransition(() => router.push("/villas"));
  }

  function toggleAmenity(a: string) {
    setSelected((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]));
  }

  function setDestination(v: string | null) {
    push((p) => {
      if (v && v !== "any") p.set("destination", v);
      else p.delete("destination");
    });
  }

  const priceActive = range[0] > sliderMin || range[1] < sliderMax;
  const destinationActive = Boolean(sp.get("destination"));
  const activeDestName =
    destinations.find((d) => d.slug === sp.get("destination"))?.name ?? "All locations";
  const activeCount =
    (priceActive ? 1 : 0) +
    (rooms > 0 ? 1 : 0) +
    (guests > 0 ? 1 : 0) +
    (destinationActive ? 1 : 0) +
    selected.length;

  return (
    <aside className="rounded-2xl border border-border/60 bg-[var(--sand)]/40 p-6 md:p-7 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-border/50 pb-4">
        <h2 className="font-display text-[26px] leading-none text-foreground">Filters</h2>
        <button
          type="button"
          onClick={clearAll}
          disabled={activeCount === 0}
          className="inline-flex items-center gap-1.5 text-xs tracking-wide text-forest hover:text-forest-deep disabled:opacity-40"
        >
          Reset all
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      {/* PRICE */}
      <section className="border-b border-border/40 py-5">
        <button
          type="button"
          onClick={() => setOpenPrice((v) => !v)}
          className="flex w-full items-center gap-3 text-left"
        >
          <IconChip>
            <Wallet className="h-4 w-4" strokeWidth={1.5} />
          </IconChip>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Price Range</div>
            <div className="text-[11.5px] text-muted-foreground">Per night</div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              openPrice ? "" : "-rotate-90"
            }`}
            strokeWidth={1.6}
          />
        </button>

        {openPrice && (
          <div className="mt-5 grid gap-4">
            <div className="px-1">
              <Slider
                min={sliderMin}
                max={sliderMax}
                step={STEP}
                value={range}
                onValueChange={onSliderChange}
                onValueCommitted={onSliderCommit}
                aria-label="Price range"
                className="my-2"
              />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>₹{sliderMin.toLocaleString("en-IN")}</span>
                <span>₹{sliderMax.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_10px_1fr] items-end gap-2">
              <label className="grid gap-1.5">
                <span className="text-[10.5px] tracking-wide text-muted-foreground">
                  Minimum
                </span>
                <Input
                  inputMode="numeric"
                  value={minP}
                  onChange={(e) => setMinP(e.target.value.replace(/[^\d]/g, ""))}
                  className="h-10 rounded-lg bg-background"
                />
              </label>
              <div className="pb-3 text-center text-muted-foreground">–</div>
              <label className="grid gap-1.5">
                <span className="text-[10.5px] tracking-wide text-muted-foreground">
                  Maximum
                </span>
                <Input
                  inputMode="numeric"
                  value={maxP}
                  onChange={(e) => setMaxP(e.target.value.replace(/[^\d]/g, ""))}
                  className="h-10 rounded-lg bg-background"
                />
              </label>
            </div>

            <Button
              onClick={applyInputs}
              className="mt-1 h-11 w-full rounded-lg bg-forest text-sand hover:bg-forest-deep"
            >
              Apply Filters
            </Button>
          </div>
        )}
      </section>

      {/* BEDROOMS */}
      <CompactRow
        icon={<BedDouble className="h-4 w-4" strokeWidth={1.5} />}
        label="Bedrooms"
      >
        <Stepper
          value={rooms}
          onDec={() => setRooms((r) => Math.max(0, r - 1))}
          onInc={() => setRooms((r) => Math.min(20, r + 1))}
          format={(v) => (v === 0 ? "Any" : `${v}+`)}
        />
      </CompactRow>

      {/* GUESTS */}
      <CompactRow
        icon={<Users className="h-4 w-4" strokeWidth={1.5} />}
        label="Guests"
      >
        <Stepper
          value={guests}
          onDec={() => setGuests((g) => Math.max(0, g - 1))}
          onInc={() => setGuests((g) => Math.min(20, g + 1))}
          format={(v) => (v === 0 ? "Any" : `${v}+`)}
        />
      </CompactRow>

      {/* LOCATION — collapsible list, single-select */}
      <section className="border-b border-border/40 py-5">
        <button
          type="button"
          onClick={() => setOpenLoc((v) => !v)}
          className="flex w-full items-center gap-3 text-left"
        >
          <IconChip>
            <MapPin className="h-4 w-4" strokeWidth={1.5} />
          </IconChip>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Location</div>
            <div className="text-[11.5px] text-muted-foreground">{activeDestName}</div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              openLoc ? "" : "-rotate-90"
            }`}
            strokeWidth={1.6}
          />
        </button>
        {openLoc && (
          <ul className="mt-4 grid max-h-72 gap-1.5 overflow-y-auto pr-2">
            <li>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-[13.5px] text-foreground hover:bg-background/60">
                <input
                  type="checkbox"
                  checked={!destinationActive}
                  onChange={() => setDestination(null)}
                  className="h-4 w-4 accent-forest"
                />
                Any location
              </label>
            </li>
            {destinations.map((d) => {
              const active = sp.get("destination") === d.slug;
              return (
                <li key={d.slug}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-[13.5px] text-foreground hover:bg-background/60">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => setDestination(active ? null : d.slug)}
                      className="h-4 w-4 accent-forest"
                    />
                    {d.name}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* AMENITIES */}
      <section className="border-b border-border/40 py-5">
        <button
          type="button"
          onClick={() => setOpenAmen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <h3 className="text-sm font-medium text-foreground">
            Amenities
            {selected.length > 0 && (
              <span className="ml-2 text-[11.5px] font-normal text-terracotta">
                {selected.length} selected
              </span>
            )}
          </h3>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              openAmen ? "" : "-rotate-90"
            }`}
            strokeWidth={1.6}
          />
        </button>
        {openAmen && (
          <div className="mt-4 grid gap-2">
            <ul className="grid gap-1.5">
              {featured.map((f) => (
                <li key={f.value}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-[13.5px] text-foreground hover:bg-background/60">
                    <input
                      type="checkbox"
                      checked={selected.includes(f.value)}
                      onChange={() => toggleAmenity(f.value)}
                      className="h-4 w-4 accent-forest"
                    />
                    {f.label}
                  </label>
                </li>
              ))}
            </ul>

            {moreAmenities.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowMoreAmenities((v) => !v)}
                  className="justify-self-start text-xs font-medium text-terracotta hover:underline"
                >
                  {showMoreAmenities ? "Fewer filters" : "More filters"}
                </button>
                {showMoreAmenities && (
                  <ul className="grid max-h-80 gap-1.5 overflow-y-auto pr-2">
                    {moreAmenities.map((a) => (
                      <li key={a}>
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-[13.5px] text-foreground hover:bg-background/60">
                          <input
                            type="checkbox"
                            checked={selected.includes(a)}
                            onChange={() => toggleAmenity(a)}
                            className="h-4 w-4 accent-forest"
                          />
                          {a}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* Brand line */}
      <div className="mt-5 flex items-center gap-2.5 text-[11.5px] italic tracking-wide text-forest/80">
        <Leaf className="h-3.5 w-3.5" strokeWidth={1.4} />
        <span className="font-display not-italic text-[13px]">
          Handpicked homes. Genuine experiences.
        </span>
      </div>
    </aside>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-[var(--sand)]/70 text-forest">
      {children}
    </span>
  );
}

function CompactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex items-center gap-3 border-b border-border/40 py-4">
      <IconChip>{icon}</IconChip>
      <div className="flex-1 text-sm font-medium text-foreground">{label}</div>
      {children}
    </section>
  );
}

function Stepper({
  value,
  onDec,
  onInc,
  format,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  format: (v: number) => string;
}) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-border/70 bg-background">
      <button
        type="button"
        onClick={onDec}
        disabled={value === 0}
        aria-label="Decrease"
        className="flex h-8 w-8 items-center justify-center text-forest hover:bg-[var(--sand)]/60 disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={1.6} />
      </button>
      <div className="min-w-[42px] border-x border-border/70 px-2 text-center text-[13px] text-foreground">
        {format(value)}
      </div>
      <button
        type="button"
        onClick={onInc}
        aria-label="Increase"
        className="flex h-8 w-8 items-center justify-center text-forest hover:bg-[var(--sand)]/60"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.6} />
      </button>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
