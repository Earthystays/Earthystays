"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpDown } from "lucide-react";

const OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

export function SortDropdown({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, start] = useTransition();

  function set(value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value && value !== "featured") next.set("sort", value);
    else next.delete("sort");
    start(() => router.push(`/villas${next.toString() ? `?${next}` : ""}`));
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">Sort:</span>
      <select
        value={currentSort}
        onChange={(e) => set(e.target.value)}
        className="bg-transparent text-foreground outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
