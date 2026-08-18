import type { Metadata } from "next";
import { VillaListItem } from "@/components/villa-list-item";
import { MobileFiltersDrawer } from "@/components/mobile-filters-drawer";
import { VillaFiltersSidebar } from "@/components/villa-filters-sidebar";
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
  title: "Luxury Villas for Rent in India | Private Pools & Full Staff",
  description:
    "Handpicked luxury villas across Goa, Maharashtra, Rajasthan and beyond — private pools, full staff, and 24/7 support. Filter by price, rooms, and amenities to find your stay.",
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
  // "Earthy Recommends" rhythm: ONE editorial card after every 6 standard
  // listings, capped below 15% of the page, never adjacent. Picks come from
  // admin-flagged `featured` villas; any beyond the cap render as standard
  // cards. Only under the default sort — price/rating sorts stay untouched.
  let entries = results.map((villa) => ({ villa, recommended: false }));
  if (!filters.sort || filters.sort === "featured") {
    const maxPicks = Math.floor(results.length / 7); // 1-in-7 ≈ 14% ceiling
    const picks = results.filter((v) => v.featured).slice(0, maxPicks);
    if (picks.length > 0) {
      const pickSet = new Set(picks.map((v) => v.slug));
      const stream = results.filter((v) => !pickSet.has(v.slug));
      const woven: typeof entries = [];
      let pi = 0;
      stream.forEach((villa, i) => {
        woven.push({ villa, recommended: false });
        if ((i + 1) % 6 === 0 && pi < picks.length)
          woven.push({ villa: picks[pi++], recommended: true });
      });
      // Safety: if the tail never reached a weave point, drop remaining
      // picks back in as standard cards rather than losing them.
      woven.push(...picks.slice(pi).map((villa) => ({ villa, recommended: false })));
      entries = woven;
    }
  }
  const amenities = getAllAmenities();
  const bounds = getPriceBounds();
  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  // Resolve readable city/state name for the breadcrumb trail
  let cityLabel: string | undefined;
  if (stateSlug || citySlug) {
    const index = getCityIndex("villa");
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
          { label: "Villas", href: "/villas" },
          ...(cityLabel ? [{ label: cityLabel }] : [{ label: "All villas" }]),
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
        {/* Sidebar — hidden on mobile (replaced by drawer trigger above) */}
        <div className="hidden lg:sticky lg:top-32 lg:block lg:self-start">
          <VillaFiltersSidebar
            amenities={amenities}
            destinations={destinations}
            priceMin={bounds.min}
            priceMax={bounds.max}
          />
        </div>

        {/* Results */}
        <div>
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
              <p className="font-display text-2xl">No villas match those filters.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening the price range or unchecking some amenities.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {entries.map(({ villa, recommended }, idx) => (
                <VillaListItem
                  key={villa.slug}
                  villa={villa}
                  loggedIn={!!user}
                  inWishlist={wishlist.has(villa.slug)}
                  index={idx}
                  recommended={recommended}
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
