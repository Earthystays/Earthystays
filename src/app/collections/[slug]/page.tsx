import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCollections, getCollectionBySlug } from "@/lib/data/collections";
import { getCollectionSeoContent } from "@/lib/data/collection-content";
import {
  searchVillas,
  getAllAmenities,
  getPriceBounds,
  type VillaFilters as Filters,
} from "@/lib/data/villas";
import { destinations } from "@/lib/data/locations";
import { VillaListItem } from "@/components/villa-list-item";
import { VillaFiltersSidebar } from "@/components/villa-filters-sidebar";
import { MobileFiltersDrawer } from "@/components/mobile-filters-drawer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BreadcrumbJsonLd } from "@/components/jsonld-breadcrumb";
import { SortDropdown } from "@/components/sort-dropdown";
import { getCurrentUser } from "@/lib/session";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  return getAllCollections().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const col = getCollectionBySlug(slug);
  if (!col) return { title: "Not found" };
  const seo = getCollectionSeoContent(slug, col.name, col.blurb);
  return {
    title: seo.title,
    description: seo.description,
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

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const col = getCollectionBySlug(slug);
  if (!col) notFound();
  const seo = getCollectionSeoContent(slug, col.name, col.blurb);

  const sp = await searchParams;
  const filters: Filters = {
    collection: col.slug,
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

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    { label: col.name, href: `/collections/${col.slug}` },
  ];

  return (
    <div className="bg-[#FAF8F5]">
    <div className="container-page !max-w-[1600px] py-8 lg:px-8 lg:py-12">
      <BreadcrumbJsonLd items={crumbs} />
      <Breadcrumbs items={crumbs} />

      {/* Heading kept for SEO/accessibility (a real H1 matching the page's
          content is why these pages started getting indexed) but hidden
          visually per owner request — the page reads cleaner without it. */}
      <h1 className="sr-only">{seo.heading}</h1>

      <div className="mt-6 flex items-center justify-end gap-2">
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
          {villas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
              <p className="font-display text-2xl">
                No stays in this collection match those filters.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening the price range or unchecking some amenities.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {villas.map((villa, idx) => (
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
