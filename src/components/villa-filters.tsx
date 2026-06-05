"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { destinations } from "@/lib/data/locations";
import { collections } from "@/lib/data/collections";
import { X } from "lucide-react";

export function VillaFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function set(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== "any") params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`/villas${params.toString() ? `?${params.toString()}` : ""}`);
    });
  }

  function clearAll() {
    startTransition(() => router.push("/villas"));
  }

  const active =
    Boolean(sp.get("destination")) ||
    Boolean(sp.get("collection")) ||
    Boolean(sp.get("guests")) ||
    Boolean(sp.get("sort"));

  return (
    <div className="flex flex-wrap items-center gap-3" aria-busy={isPending}>
      <Select value={sp.get("destination") ?? "any"} onValueChange={(v) => set("destination", v)}>
        <SelectTrigger className="rounded-full px-4 w-auto min-w-44"><SelectValue placeholder="Destination" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any destination</SelectItem>
          {destinations.map((d) => (
            <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sp.get("collection") ?? "any"} onValueChange={(v) => set("collection", v)}>
        <SelectTrigger className="rounded-full px-4 w-auto min-w-44"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any type</SelectItem>
          {collections.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sp.get("guests") ?? "any"} onValueChange={(v) => set("guests", v)}>
        <SelectTrigger className="rounded-full px-4 w-auto min-w-36"><SelectValue placeholder="Guests" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any size</SelectItem>
          {[2, 4, 6, 8, 10, 12, 14, 16].map((n) => (
            <SelectItem key={n} value={String(n)}>{n}+ guests</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sp.get("sort") ?? "featured"} onValueChange={(v) => set("sort", v === "featured" ? null : v)}>
        <SelectTrigger className="rounded-full px-4 w-auto min-w-44"><SelectValue placeholder="Sort" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="featured">Featured</SelectItem>
          <SelectItem value="price-asc">Price: low to high</SelectItem>
          <SelectItem value="price-desc">Price: high to low</SelectItem>
          <SelectItem value="rating">Top rated</SelectItem>
        </SelectContent>
      </Select>

      {active && (
        <Button onClick={clearAll} variant="ghost" size="sm" className="rounded-full text-muted-foreground">
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
