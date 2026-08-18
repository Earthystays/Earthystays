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
import { destinations } from "@/lib/data/locations";
import { SortDropdown } from "@/components/sort-dropdown";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Serviced Apartments & City Stays in India | Earthy Stays",
  description:
    "Handpicked serviced apartments and city flats — fully furnished, hassle-free check-in, and dedicated support throughout your stay. Browse by city, price, and amenities.",
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

export default async function ApartmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const stateSlug = typeof sp.state === "string" ? sp.state : undefined;
  const citySlug = typeof sp.city === "string" ? sp.city : undefined;
  const filters: Filters = {
    type: "apartment",
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

  let cityLabel: string | undefined;
  if (stateSlug || citySlug) {
    const index = getCityIndex("apartment");
    const state = index.find((s) => s.stateSlug === stateSlug);
    const city = state?.cities.find((c) => c.slug === citySlug);
    if (city) {
      cityLabel = city.name;
    } else if (state) {
      cityLabel = state.stateName;
    }
  }

  return (
    <div className="bg-[#FAF8F5]">
    <div className="container-page !max-w-[1600px] py-8 lg:px-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Apartments", href: "/apartments" },
          ...(cityLabel ? [{ label: cityLabel }] : []),
        ]}
      />
      <div className="mt-4 flex items-center justify-end gap-2">
        <MobileFiltersDrawer
          amenities={amenities}
          destinations={destinations}
          priceMin={bounds.min}
          priceMax={bounds.max}
        />
        <SortDropdown currentSort={filters.sort ?? "featured"} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="hidden lg:sticky lg:top-32 lg:block lg:self-start">
          <VillaFiltersSidebar
            amenities={amenities}
            destinations={destinations}
            priceMin={bounds.min}
            priceMax={bounds.max}
          />
        </div>

        <div>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
              <p className="font-display text-2xl">No apartments listed yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add one from the admin dashboard (Property type → Apartment) to see it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {results.map((villa, idx) => (
                <VillaListItem
                  key={villa.slug}
                  villa={villa}
                  loggedIn={!!user}
                  inWishlist={wishlist.has(villa.slug)}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
    </div>
  );
}
