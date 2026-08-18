"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import type { ExperienceCategory } from "@/lib/types";

type CityOption = { slug: string; name: string; count: number };

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

const DIFFICULTIES = ["Easy", "Moderate", "Challenging"];

export function ExperienceFilters({
  categories,
  cities,
  languages,
  /** When set, the city control is hidden (city pages are already scoped). */
  lockedCity,
}: {
  categories: ExperienceCategory[];
  cities: CityOption[];
  languages: string[];
  lockedCity?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (!value) next.delete(key);
      else next.set(key, value);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const activeCategory = params.get("category");
  const activeSort = params.get("sort") ?? "newest";

  return (
    <div className="space-y-5">
      {/* Search + sort row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            defaultValue={params.get("q") ?? ""}
            onChange={(e) => setParam("q", e.target.value || null)}
            placeholder="Search experiences…"
            className="w-full rounded-full border border-border/70 bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <select
            value={activeSort}
            onChange={(e) => setParam("sort", e.target.value === "newest" ? null : e.target.value)}
            className="rounded-full border border-border/70 bg-card px-4 py-2.5 text-sm outline-none transition focus:border-primary"
            aria-label="Sort experiences"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setParam("category", null)}
          className={pill(!activeCategory)}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setParam("category", activeCategory === c.slug ? null : c.slug)}
            className={pill(activeCategory === c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-2">
        {!lockedCity && cities.length > 1 && (
          <select
            value={params.get("city") ?? ""}
            onChange={(e) => setParam("city", e.target.value || null)}
            className={control}
            aria-label="City"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        )}
        <select
          value={params.get("difficulty") ?? ""}
          onChange={(e) => setParam("difficulty", e.target.value || null)}
          className={control}
          aria-label="Difficulty"
        >
          <option value="">Any difficulty</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {languages.length > 0 && (
          <select
            value={params.get("language") ?? ""}
            onChange={(e) => setParam("language", e.target.value || null)}
            className={control}
            aria-label="Language"
          >
            <option value="">Any language</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-sm">
          <input
            type="checkbox"
            checked={params.get("private") === "1"}
            onChange={(e) => setParam("private", e.target.checked ? "1" : null)}
            className="accent-primary"
          />
          Private available
        </label>
      </div>
    </div>
  );
}

const control =
  "rounded-full border border-border/70 bg-card px-4 py-2 text-sm outline-none transition focus:border-primary";

function pill(active: boolean) {
  return [
    "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition whitespace-nowrap",
    active
      ? "bg-primary text-primary-foreground"
      : "border border-border/70 bg-card text-foreground hover:border-primary/50",
  ].join(" ");
}
