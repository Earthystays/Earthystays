import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { destinations, getStateBySlug } from "@/lib/data/locations";
import { getVillasByDestination } from "@/lib/data/villas";
import { getStateCover, getCityCover } from "@/lib/data/location-covers";
import { VillaCard } from "@/components/villa-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/session";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dest = getStateBySlug(slug);
  if (!dest) return { title: "Not found" };
  return {
    title: dest.name,
    description: dest.blurb,
    openGraph: { images: [dest.image.src] },
  };
}

export default async function StatePage({ params }: PageProps) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();
  const villas = getVillasByDestination(state.slug);
  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  return (
    <div>
      <section className="relative h-[55vh] min-h-[400px]">
        <Image src={getStateCover(state.slug) ?? state.image.src} alt={state.image.alt} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/70" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-10 text-white">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Locations", href: "/locations" },
              { label: state.name },
            ]}
          />
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/80">{state.region}</p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">{state.name}</h1>
          <p className="mt-3 max-w-xl text-white/85">{state.blurb}</p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="font-display text-3xl">About {state.name}</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">{state.description}</p>
          </div>
          <div>
            <h3 className="font-display text-2xl">Cities in {state.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {state.cities.length} {state.cities.length === 1 ? "area" : "areas"} to choose from.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {state.cities.map((city) => {
                const cityVillas = villas.filter((v) => slugCity(v.city ?? "") === city.slug);
                return (
                  <Link
                    key={city.slug}
                    href={`/locations/${state.slug}/${city.slug}`}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl"
                  >
                    <Image
                      src={getCityCover(state.slug, city.slug) ?? city.image.src}
                      alt={city.image.alt}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <h4 className="font-display text-xl">{city.name}</h4>
                      <p className="mt-1 text-xs text-white/85 line-clamp-2">{city.blurb}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/75">
                        {cityVillas.length} {cityVillas.length === 1 ? "villa" : "villas"} →
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {villas.length > 0 && (
        <section className="container-page pb-20">
          <h3 className="font-display text-3xl">All villas in {state.name}</h3>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {villas.map((v) => (
              <VillaCard
                key={v.slug}
                villa={v}
                loggedIn={!!user}
                inWishlist={wishlist.has(v.slug)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function slugCity(s: string): string {
  return s.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
