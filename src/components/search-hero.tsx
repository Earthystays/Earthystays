"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { destinations } from "@/lib/data/locations";

export function SearchHero() {
  const router = useRouter();
  const [destination, setDestination] = useState<string>("");
  const [guests, setGuests] = useState<string>("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (guests) params.set("guests", guests);
    router.push(`/villas${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/95 p-2 shadow-xl backdrop-blur-md sm:flex-row sm:items-stretch sm:rounded-full sm:gap-0 sm:p-1.5"
    >
      <label className="flex flex-1 items-center gap-3 rounded-xl px-5 py-2.5 transition-colors hover:bg-muted/40 sm:rounded-full">
        <MapPin className="h-4 w-4 text-terracotta shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Where to
          </div>
          <Select value={destination} onValueChange={(v) => setDestination(v ?? "")}>
            <SelectTrigger
              className="border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0 focus-visible:ring-0 text-[15px] text-foreground"
            >
              <SelectValue placeholder="Any destination" />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((d) => (
                <SelectItem key={d.slug} value={d.slug}>
                  {d.name} · {d.region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </label>

      <div className="hidden self-center w-px bg-border/80 sm:block sm:h-9" />

      <label className="flex flex-1 items-center gap-3 rounded-xl px-5 py-2.5 transition-colors hover:bg-muted/40 sm:rounded-full">
        <Users className="h-4 w-4 text-terracotta shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Guests
          </div>
          <Select value={guests} onValueChange={(v) => setGuests(v ?? "")}>
            <SelectTrigger
              className="border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0 focus-visible:ring-0 text-[15px] text-foreground"
            >
              <SelectValue placeholder="How many" />
            </SelectTrigger>
            <SelectContent>
              {[2, 4, 6, 8, 10, 12, 14, 16].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}+ guests</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </label>

      <Button
        type="submit"
        className="h-12 rounded-xl px-6 text-sm font-medium tracking-wide sm:h-auto sm:rounded-full sm:px-7 sm:ml-1"
      >
        <Search className="h-4 w-4 mr-2" /> Find villas
      </Button>
    </form>
  );
}
