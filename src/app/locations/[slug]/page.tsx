import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { destinations, getStateBySlug } from "@/lib/data/locations";
import {
  searchVillas,
  getAllAmenities,
  getPriceBounds,
  type VillaFilters as Filters,
} from "@/lib/data/villas";
import { VillaListItem } from "@/components/villa-list-item";
import { VillaFiltersSidebar } from "@/components/villa-filters-sidebar";
import { MobileFiltersDrawer } from "@/components/mobile-filters-drawer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SortDropdown } from "@/components/sort-dropdown";
import { getCurrentUser } from "@/lib/session";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dest = getStateBySlug(slug);
  if (!dest) return { title: "Not found" };
  return {
    title: `Villas in ${dest.name}`,
    description: dest.blurb,
  };
}

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

export default async function StatePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const sp = await searchParams;
  const filters: Filters = {
    state: state.slug,
    guests: readNumber(sp.guests),
    bedrooms: readNumber(sp.rooms),
    minPrice: readNumber(sp.minPrice),
    maxPrice: readNumber(sp.maxPrice),
    amenities: readStringArray(sp.amenity),
    sort: typeof sp.sort === "string" ? (sp.sort as Filters["sort"]) : undefined,
  };

  const villas = searchVillas(filters);
  const amenities = getAllAmenities();
  const bounds = getPriceBounds();
  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  return (
    <div className="container-page py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Locations", href: "/locations" },
          { label: state.name },
        ]}
      />

      <header className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">
            Villas in {state.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {villas.length} {villas.length === 1 ? "stay" : "stays"} match your filters.
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
        <div className="hidden lg:sticky lg:top-32 lg:block lg:self-start">
          <VillaFiltersSidebar
            amenities={amenities}
            priceMin={bounds.min}
            priceMax={bounds.max}
          />
        </div>

        <div>
          {villas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
              <p className="font-display text-2xl">
                No stays in {state.name} match those filters.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening the price range or unchecking some amenities.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {villas.map((villa) => (
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
