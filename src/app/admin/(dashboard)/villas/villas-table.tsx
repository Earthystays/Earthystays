"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Search, X } from "lucide-react";
import type { Villa } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { DeleteVillaButton } from "./delete-button";
import { AssignHostButton } from "./assign-host-modal";

type TypeFilter = "all" | "villa" | "apartment";

export type HostInfo = { name: string; email: string };

export function VillasTable({
  villas,
  hostsById,
}: {
  villas: Villa[];
  /** userId → host, for the Host column. */
  hostsById: Record<string, HostInfo>;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  // Build the list of cities present in the data, scoped by the current type
  const cityOptions = useMemo(() => {
    const set = new Map<string, { name: string; count: number }>();
    for (const v of villas) {
      if (typeFilter !== "all" && (v.type ?? "villa") !== typeFilter) continue;
      const key = (v.city ?? "").trim();
      if (!key) continue;
      const existing = set.get(key);
      set.set(key, { name: key, count: (existing?.count ?? 0) + 1 });
    }
    return [...set.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [villas, typeFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return villas.filter((v) => {
      if (typeFilter !== "all" && (v.type ?? "villa") !== typeFilter) return false;
      if (cityFilter !== "all" && (v.city ?? "").trim() !== cityFilter) return false;
      if (!q) return true;
      const haystack = [
        v.name,
        v.slug,
        v.tagline,
        v.destinationSlug,
        v.state ?? "",
        v.city ?? "",
        v.locationNote,
        v.type ?? "villa",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [villas, query, typeFilter, cityFilter]);

  // Reset city filter if the selected city disappears when type changes
  const cityFilterValid =
    cityFilter === "all" || cityOptions.some((c) => c.name === cityFilter);
  if (!cityFilterValid && cityFilter !== "all") {
    // setState in render is safe in React 19 for derived state reset
    setCityFilter("all");
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, slug, city, state, or destination…"
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length === villas.length
            ? `${villas.length} ${villas.length === 1 ? "property" : "properties"}`
            : `${filtered.length} of ${villas.length} match`}
        </p>
      </div>

      {/* Type filter */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Type:</span>
        {(["all", "villa", "apartment"] as TypeFilter[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`rounded-full border px-3 py-1 capitalize transition-colors ${
              typeFilter === t
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : `${t}s`}
          </button>
        ))}
      </div>

      {/* City filter */}
      {cityOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">City:</span>
          <button
            type="button"
            onClick={() => setCityFilter("all")}
            className={`rounded-full border px-3 py-1 transition-colors ${
              cityFilter === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All cities
          </button>
          {cityOptions.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCityFilter(c.name)}
              className={`rounded-full border px-3 py-1 transition-colors ${
                cityFilter === c.name
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {c.name}
              <span className="ml-1.5 opacity-70 tabular-nums">{c.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead className="border-b border-border/60 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Property</th>
              <th className="px-5 py-3 font-medium">Location</th>
              <th className="px-5 py-3 font-medium">Details</th>
              <th className="px-5 py-3 text-right font-medium">Price / night</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <p className="font-display text-2xl">No matches</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try a different name, city, or clear the search.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((v) => {
                const host = v.hostId ? hostsById[v.hostId] : undefined;
                const stateOrDest = v.state || v.destinationSlug.replace(/-/g, " ");
                return (
                <tr key={v.slug} className="align-top hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {highlight(v.name, query)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {v.tagline}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] capitalize">
                            {v.type ?? "villa"}
                          </Badge>
                          {v.featured && (
                            <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                              Featured
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {host ? host.name : <em className="not-italic opacity-70">Team-managed</em>}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-foreground">
                      {v.city || <span className="text-xs italic text-muted-foreground">—</span>}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">{stateOrDest}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                    {v.bedrooms} BR · {v.maxGuests} guests
                  </td>
                  <td className="px-5 py-4 text-right text-foreground tabular-nums whitespace-nowrap">
                    {formatINR(v.pricePerNight)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/villas/${v.slug}`}
                        target="_blank"
                        title="View on public site"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <AssignHostButton slug={v.slug} villaName={v.name} host={host} />
                      <Link
                        href={`/admin/villas/${v.slug}/edit`}
                        title="Edit"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-terracotta hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteVillaButton slug={v.slug} name={v.name} />
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Wrap matched substring in a yellow highlight chip. */
function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-yellow-200/70 px-0.5 text-foreground">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}
