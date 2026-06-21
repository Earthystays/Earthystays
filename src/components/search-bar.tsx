"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { CallbackModal } from "@/components/callback-modal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function toISO(d: Date | undefined): string | undefined {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildParams({
  destination,
  range,
  guests,
}: {
  destination: string;
  range: DateRange | undefined;
  guests: Guests;
}) {
  const params = new URLSearchParams();
  if (destination) params.set("destination", destination);
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
}: {
  destinations: Destination[];
}) {
  const router = useRouter();
  const [destination, setDestination] = useState<string>("");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState<Guests>(DEFAULT_GUESTS);
  const [sheetOpen, setSheetOpen] = useState(false);

  function go(g: Guests = guests) {
    const params = buildParams({ destination, range, guests: g });
    setSheetOpen(false);
    router.push(`/villas${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    go();
  }

  const selectedDest = destination
    ? destinations.find((d) => d.slug === destination)?.name
    : undefined;

  const locationField = (
    <Field label="Location/Villas/Landmark">
      <Select value={destination} onValueChange={(v) => setDestination(v ?? "")}>
        <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-[15px] text-foreground shadow-none focus:ring-0 focus-visible:ring-0">
          <SelectValue placeholder="Where To?" />
        </SelectTrigger>
        <SelectContent className="!w-auto min-w-[260px] max-w-[420px]">
          {destinations.map((d) => (
            <SelectItem key={d.slug} value={d.slug}>
              <span className="whitespace-nowrap">
                {d.name}
                <span className="ml-1.5 text-muted-foreground">· {d.region}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );

  const checkInField = (
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
  );

  const checkOutField = (
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
  );

  const guestsField = (
    <GuestsPicker
      value={guests}
      onChange={setGuests}
      onApplyAndSearch={(g) => go(g)}
    />
  );

  return (
    <div className="container-page">
      {/* MOBILE — slim pill trigger that opens the search sheet */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex w-full items-center gap-3 rounded-full border border-border bg-card px-5 py-4 text-left shadow-xl transition-colors hover:bg-muted/40 md:hidden"
        aria-label="Open search"
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-[15px] text-muted-foreground">
          Search for a property in{" "}
          <span className="font-medium text-foreground">
            {selectedDest ?? "India"}
          </span>
        </span>
      </button>

      {/* DESKTOP — original inline card with the full form */}
      <div className="hidden overflow-visible rounded-2xl border border-border/60 bg-card shadow-2xl md:block">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 divide-y divide-border/60 md:grid-cols-[1.4fr_1fr_1fr_1.1fr_auto] md:divide-x md:divide-y-0"
        >
          {locationField}
          {checkInField}
          {checkOutField}
          {guestsField}
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

          <form
            onSubmit={submit}
            className="flex-1 px-5 py-5"
          >
            <div className="grid grid-cols-1 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
              {locationField}
              <div className="grid grid-cols-2 divide-x divide-border/60">
                {checkInField}
                {checkOutField}
              </div>
              {guestsField}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block px-5 py-3.5 transition-colors hover:bg-muted/30">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </label>
  );
}
