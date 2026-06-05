import type { Metadata } from "next";
import { VillaListItem } from "@/components/villa-list-item";
import { VillaFiltersSidebar } from "@/components/villa-filters-sidebar";
import { MobileFiltersDrawer } from "@/components/mobile-filters-drawer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  searchVillas,
  getAllAmenities,
  getPriceBounds,
  getCityIndex,
  type VillaFilters as Filters,
} from "@/lib/data/villas";
import { SortDropdown } from "@/components/sort-dropdown";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "All villas",
  description: "Browse the full Earthy Stays collection — filter by price, rooms, amenities.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readNumber(v: string | string[] | undefined): number | undefined {
  if (!v) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function readStringArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function VillasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const stateSlug = typeof sp.state === "string" ? sp.state : undefined;
  const citySlug = typeof sp.city === "string" ? sp.city : undefined;
  const filters: Filters = {
    type: "villa",
    destination: typeof sp.destination === "string" ? sp.destination : undefined,
    state: stateSlug,
    city: citySlug,
    guests: readNumber(sp.guests),
    bedrooms: readNumber(sp.rooms),
    minPrice: readNumber(sp.minPrice),
    maxPrice: readNumber(sp.maxPrice),
    amenities: readStringArray(sp.amenity),
    sort: typeof sp.sort === "string" ? (sp.sort as Filters["sort"]) : undefined,
  };
  const results = searchVillas(filters);
  const amenities = getAllAmenities();
  const bounds = getPriceBounds();
  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  // Resolve readable city/state names from the index for the page title
  let pageTitle = "All Villas";
  let cityLabel: string | undefined;
  if (stateSlug || citySlug) {
    const index = getCityIndex("villa");
    const state = index.find((s) => s.stateSlug === stateSlug);
    const city = state?.cities.find((c) => c.slug === citySlug);
    if (city) {
      pageTitle = `Villas in ${city.name}`;
      cityLabel = city.name;
    } else if (state) {
      pageTitle = `Villas in ${state.stateName}`;
      cityLabel = state.stateName;
    }
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Villas", href: "/villas" },
          ...(cityLabel ? [{ label: cityLabel }] : [{ label: "All villas" }]),
        ]}
      />
      <header className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">{pageTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? "stay" : "stays"} match your filters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MobileFiltersDrawer
            amenities={amenities}
            priceMin={bounds.min}
            priceMax={bounds.max}
          />
          <SortDropdown currentSort={filters.sort ?? "featured"} />
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar — hidden on mobile (replaced by drawer trigger above) */}
        <div className="hidden lg:sticky lg:top-32 lg:block lg:self-start">
          <VillaFiltersSidebar
            amenities={amenities}
            priceMin={bounds.min}
            priceMax={bounds.max}
          />
        </div>

        {/* Results */}
        <div>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
              <p className="font-display text-2xl">No villas match those filters.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening the price range or unchecking some amenities.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {results.map((villa) => (
                <VillaListItem
                  key={villa.slug}
                  villa={villa}
                  loggedIn={!!user}
                  inWishlist={wishlist.has(villa.slug)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
