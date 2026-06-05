"use client";

import { useState } from "react";
import { ICON_OPTIONS } from "@/lib/amenity-catalog";
import { Check, Search } from "lucide-react";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? ICON_OPTIONS.filter((o) => o.name.toLowerCase().includes(q))
    : ICON_OPTIONS;

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons…"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>
      <div className="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto rounded-md border border-input bg-background p-2 sm:grid-cols-8">
        {filtered.map((o) => {
          const active = value === o.name;
          return (
            <button
              key={o.name}
              type="button"
              onClick={() => onChange(o.name)}
              title={o.name}
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <o.Icon className="h-4 w-4" strokeWidth={1.6} />
              {active && (
                <Check className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-background p-0.5 text-primary" />
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-6 text-center text-xs text-muted-foreground">
            No icons match &quot;{query}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
