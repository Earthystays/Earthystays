"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Minus, Plus, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const STEP = 1000;

export function VillaFiltersSidebar({
  amenities,
  priceMin,
  priceMax,
  defaultExpanded = true,
}: {
  amenities: string[];
  priceMin: number;
  priceMax: number;
  /** Desktop sidebar wants sections expanded by default; mobile drawer
   *  passes false so the drawer doesn't open as a wall of controls. */
  defaultExpanded?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  // Snap bounds to step
  const sliderMin = Math.floor(priceMin / STEP) * STEP;
  const sliderMax = Math.ceil(priceMax / STEP) * STEP;

  const urlMin = Number(sp.get("minPrice") ?? "") || sliderMin;
  const urlMax = Number(sp.get("maxPrice") ?? "") || sliderMax;
  const initialRooms = Number(sp.get("rooms") ?? 0) || 0;
  const initialAmens = sp.getAll("amenity");

  const [range, setRange] = useState<[number, number]>([
    clamp(urlMin, sliderMin, sliderMax),
    clamp(urlMax, sliderMin, sliderMax),
  ]);
  const [minP, setMinP] = useState<string>(String(range[0]));
  const [maxP, setMaxP] = useState<string>(String(range[1]));
  const [rooms, setRooms] = useState<number>(initialRooms);
  const [selected, setSelected] = useState<string[]>(initialAmens);
  // Section expansion follows the prop — desktop (true) opens everything so
  // filters are scannable at a glance; mobile drawer (false) keeps them
  // collapsed so the drawer isn't overwhelming on open.
  const [openPrice, setOpenPrice] = useState(defaultExpanded);
  const [openAmen, setOpenAmen] = useState(defaultExpanded);

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

  // Sync URL when rooms changes
  useEffect(() => {
    if (rooms === initialRooms) return;
    push((p) => {
      if (rooms > 0) p.set("rooms", String(rooms));
      else p.delete("rooms");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  // Sync URL when amenity selection changes
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
    setSelected([]);
    startTransition(() => router.push("/villas"));
  }

  function toggleAmenity(a: string) {
    setSelected((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]));
  }

  const priceActive = range[0] > sliderMin || range[1] < sliderMax;
  const activeCount =
    (priceActive ? 1 : 0) + (rooms > 0 ? 1 : 0) + selected.length;

  return (
    <aside className="grid gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Filters</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* PRICE RANGE — collapsible */}
      <section className="grid gap-4 border-t border-border/60 pt-5">
        <button
          type="button"
          onClick={() => setOpenPrice((v) => !v)}
          className="flex items-baseline justify-between"
        >
          <h3 className="text-sm font-medium text-foreground">
            Price Range
            {priceActive && (
              <span className="ml-2 text-xs font-normal text-terracotta">
                ₹{range[0].toLocaleString("en-IN")} – ₹{range[1].toLocaleString("en-IN")}
              </span>
            )}
          </h3>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              openPrice ? "rotate-180" : ""
            }`}
          />
        </button>

        {openPrice && (
          <>
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
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>₹{sliderMin.toLocaleString("en-IN")}</span>
                <span>₹{sliderMax.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Min</span>
                <Input
                  inputMode="numeric"
                  value={minP}
                  onChange={(e) => setMinP(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder={`₹${sliderMin}`}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Max</span>
                <Input
                  inputMode="numeric"
                  value={maxP}
                  onChange={(e) => setMaxP(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder={`₹${sliderMax}`}
                />
              </label>
            </div>
            <Button variant="outline" onClick={applyInputs} className="w-full rounded-md">
              Apply
            </Button>
          </>
        )}
      </section>

      {/* ROOMS */}
      <section className="grid gap-3 border-t border-border/60 pt-5">
        <h3 className="text-sm font-medium text-foreground">No. of Rooms</h3>
        <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-1.5">
          <span className="text-sm text-foreground">
            {rooms === 0 ? "Any" : `${String(rooms).padStart(2, "0")}+`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setRooms((r) => Math.max(0, r - 1))}
              disabled={rooms === 0}
              aria-label="Decrease rooms"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setRooms((r) => Math.min(20, r + 1))}
              aria-label="Increase rooms"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* AMENITIES */}
      <section className="grid gap-3 border-t border-border/60 pt-5">
        <button
          type="button"
          onClick={() => setOpenAmen((v) => !v)}
          className="flex items-center justify-between"
        >
          <h3 className="text-sm font-medium text-foreground">
            Key Amenities / Features
            {selected.length > 0 && (
              <span className="ml-2 text-xs font-normal text-terracotta">
                {selected.length} selected
              </span>
            )}
          </h3>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              openAmen ? "rotate-180" : ""
            }`}
          />
        </button>
        {openAmen && (
          <ul className="grid max-h-80 gap-2 overflow-y-auto pr-2">
            {amenities.map((a) => (
              <li key={a}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-foreground hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={selected.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="h-4 w-4"
                  />
                  {a}
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
