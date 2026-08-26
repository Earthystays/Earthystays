"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

export type EntityOption = { slug: string; name: string; meta?: string };

/** Searchable single-select for embedding a property / experience / etc.
 *  by slug. Data is passed in already-loaded from the central stores. */
export function EntityPicker({
  options,
  value,
  onChange,
  placeholder = "Search…",
  label,
}: {
  options: EntityOption[];
  value?: string;
  onChange: (slug: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.slug === value);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return options.slice(0, 30);
    return options
      .filter(
        (o) =>
          o.name.toLowerCase().includes(needle) ||
          o.slug.toLowerCase().includes(needle) ||
          (o.meta ?? "").toLowerCase().includes(needle),
      )
      .slice(0, 30);
  }, [q, options]);

  return (
    <div className="relative">
      {label && <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>}
      {selected ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
          <span className="text-sm">
            {selected.name}
            {selected.meta && (
              <span className="text-muted-foreground"> · {selected.meta}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-forest"
          />
          {open && filtered.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
              {filtered.map((o) => (
                <li key={o.slug}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(o.slug);
                      setQ("");
                      setOpen(false);
                    }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>{o.name}</span>
                    {o.meta && (
                      <span className="text-xs text-muted-foreground">{o.meta}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Multi-select variant for related-properties / related-experiences lists. */
export function MultiEntityPicker({
  options,
  values,
  onChange,
  placeholder,
}: {
  options: EntityOption[];
  values: string[];
  onChange: (slugs: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      {values.map((slug) => {
        const o = options.find((x) => x.slug === slug);
        return (
          <div
            key={slug}
            className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <span>{o?.name ?? slug}</span>
            <button
              type="button"
              onClick={() => onChange(values.filter((s) => s !== slug))}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <EntityPicker
        options={options.filter((o) => !values.includes(o.slug))}
        onChange={(slug) => slug && onChange([...values, slug])}
        placeholder={placeholder ?? "Add…"}
      />
    </div>
  );
}
