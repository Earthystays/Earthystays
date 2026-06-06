"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { CallbackModal } from "@/components/callback-modal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { destinations } from "@/lib/data/locations";
import { SingleDatePicker } from "@/components/single-date-picker";
import { GuestsPicker, DEFAULT_GUESTS, type Guests } from "@/components/guests-picker";

// Local DateRange shape — replaces the range-picker import.
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
  // Total people, useful for the guests >= filter on /villas
  const total = guests.adults + guests.children;
  if (total > 0) params.set("guests", String(total));
  return params;
}

export function SearchBar() {
  const router = useRouter();
  const [destination, setDestination] = useState<string>("");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState<Guests>(DEFAULT_GUESTS);

  function go(g: Guests = guests) {
    const params = buildParams({ destination, range, guests: g });
    router.push(`/villas${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    go();
  }

  return (
    <div className="container-page">
      <div className="overflow-visible rounded-2xl border border-border/60 bg-card shadow-2xl">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 divide-y divide-border/60 md:grid-cols-[1.4fr_1fr_1fr_1.1fr_auto] md:divide-x md:divide-y-0"
        >
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
                      <span className="ml-1.5 text-muted-foreground">
                        · {d.region}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Check-in — its own calendar */}
          <SingleDatePicker
            label="Check-in"
            value={range?.from}
            onChange={(d) =>
              setRange((r) => ({
                from: d,
                // If new check-in is after current check-out, clear check-out
                to: r?.to && d && r.to <= d ? undefined : r?.to,
              }))
            }
          />

          {/* Check-out — its own calendar, min = check-in + 1 day */}
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

          {/* Guests picker */}
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
