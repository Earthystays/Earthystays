import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PropertyBrowseCard } from "@/components/property-browse-card";
import { getHotels, getHostels } from "@/lib/data/villas";
import { getCurrentUser } from "@/lib/session";

/**
 * Shared browse/index for hotels & hostels. Renders a hero, an optional
 * state-filter chip row, and a responsive card grid. Both /hotels and /hostels
 * render this so the two stay visually identical bar copy.
 */
export async function PropertyBrowseIndex({
  kind,
  stateFilter,
}: {
  kind: "hotel" | "hostel";
  stateFilter?: string;
}) {
  const isHostel = kind === "hostel";
  const all = isHostel ? getHostels() : getHotels();

  // Distinct destinations present, for the filter chips.
  const stateMap = new Map<string, string>();
  for (const p of all) {
    if (!stateMap.has(p.destinationSlug)) {
      stateMap.set(p.destinationSlug, p.state ?? p.destinationSlug);
    }
  }
  const states = [...stateMap.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const properties = stateFilter
    ? all.filter((p) => p.destinationSlug === stateFilter)
    : all;

  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  const label = isHostel ? "Hostels" : "Hotels";
  const basePath = isHostel ? "/hostels" : "/hotels";
  const lead = isHostel
    ? "Social, well-run hostels — dorm beds and private dorms, handpicked for budget travellers."
    : "Handpicked hotels — choose a room that suits your stay, from deluxe rooms to premium suites.";

  return (
    <div className="bg-[#FAF8F5]">
      <div className="container-page !max-w-[1600px] py-8 lg:px-8 lg:py-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label, href: basePath },
          ]}
        />

        <header className="mt-6 max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl">{label}</h1>
          <p className="mt-3 text-muted-foreground">{lead}</p>
        </header>

        {states.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <FilterChip href={basePath} active={!stateFilter} label="All" />
            {states.map((s) => (
              <FilterChip
                key={s.slug}
                href={`${basePath}?state=${s.slug}`}
                active={stateFilter === s.slug}
                label={s.name}
              />
            ))}
          </div>
        )}

        {properties.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
            <p className="font-display text-2xl">No {label.toLowerCase()} listed yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add one from the admin dashboard (Property type → {isHostel ? "Hostel" : "Hotel"})
              to see it here.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyBrowseCard
                key={p.slug}
                villa={p}
                loggedIn={!!user}
                inWishlist={wishlist.has(p.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/50"
      }`}
    >
      {label}
    </Link>
  );
}
