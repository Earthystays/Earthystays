import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { destinations, getStateBySlug } from "@/lib/data/locations";
import { getVillasByDestination } from "@/lib/data/villas";
import { getStateCover } from "@/lib/data/location-covers";
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

/**
 * State landing page — mirrors the city page layout exactly (no cities
 * grid, just the cover + all villas in the state). Visitors who want
 * to drill into a specific city use the /locations/[state]/[city] URL
 * directly (still wired up in routing, just not surfaced as cards here).
 */
export default async function StatePage({ params }: PageProps) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();
  const villas = getVillasByDestination(state.slug);
  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  return (
    <div>
      <section className="relative h-[50vh] min-h-[360px] sm:h-[55vh] sm:min-h-[400px]">
        <Image
          src={getStateCover(state.slug) ?? state.image.src}
          alt={state.image.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/70" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-10 text-white">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Locations", href: "/locations" },
              { label: state.name },
            ]}
          />
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/80">
            {state.region}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-6xl">
            {state.name}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            {state.blurb}
          </p>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-terracotta">
              Stays in {state.name}
            </p>
            <h2 className="mt-2 font-display text-2xl sm:text-4xl">
              {villas.length} {villas.length === 1 ? "stay" : "stays"}
            </h2>
          </div>
        </div>

        {villas.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
            <p className="font-display text-xl sm:text-2xl">
              No stays in {state.name} yet.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon — we&apos;re adding new properties regularly.
            </p>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}
