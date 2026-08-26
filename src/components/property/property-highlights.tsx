import { getAmenityIcon } from "@/lib/amenity-icons";

/**
 * "Why you'll love it" — the property's strongest selling points, rendered as
 * a visual card row instead of a plain checklist.
 *
 * Fed exclusively by `villa.highlights`, which the admin writes per property.
 * When a property has no highlights the section is not rendered at all — it
 * never invents reasons.
 */
export function PropertyHighlights({ highlights }: { highlights: string[] }) {
  const items = highlights.map((h) => h.trim()).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((h) => {
        // Reuse the amenity icon map so a highlight like "Private pool" gets
        // the same glyph it has in the amenities list; unmatched text falls
        // back to the map's own default.
        const Icon = getAmenityIcon(h);
        return (
          <li
            key={h}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-terracotta/40"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand/70">
              <Icon
                className="h-5 w-5 text-terracotta"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </span>
            <span className="pt-1.5 text-sm font-medium leading-snug text-foreground">
              {h}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
