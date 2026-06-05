import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { destinations, getCityInState } from "@/lib/data/locations";
import { getVillasByCity } from "@/lib/data/villas";
import { getCityCover } from "@/lib/data/location-covers";
import { VillaCard } from "@/components/villa-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/session";

type PageProps = { params: Promise<{ slug: string; city: string }> };

export async function generateStaticParams() {
  const out: Array<{ slug: string; city: string }> = [];
  for (const d of destinations) {
    for (const c of d.cities) {
      out.push({ slug: d.slug, city: c.slug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, city } = await params;
  const found = getCityInState(slug, city);
  if (!found) return { title: "Not found" };
  return {
    title: `${found.city.name}, ${found.state.name}`,
    description: found.city.blurb,
    openGraph: { images: [found.city.image.src] },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { slug, city } = await params;
  const found = getCityInState(slug, city);
  if (!found) notFound();
  const { state, city: cityData } = found;
  const villas = getVillasByCity(state.slug, cityData.slug);
  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  return (
    <div>
      <section className="relative h-[50vh] min-h-[360px]">
        <Image
          src={getCityCover(state.slug, cityData.slug) ?? cityData.image.src}
          alt={cityData.image.alt}
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
              { label: state.name, href: `/locations/${state.slug}` },
              { label: cityData.name },
            ]}
          />
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/80">
            {state.name} · {state.region}
          </p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">{cityData.name}</h1>
          <p className="mt-3 max-w-xl text-white/85">{cityData.blurb}</p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-terracotta">
              Villas in {cityData.name}
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              {villas.length} {villas.length === 1 ? "stay" : "stays"}
            </h2>
          </div>
          <a
            href={`/locations/${state.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to {state.name}
          </a>
        </div>

        {villas.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-2xl">No villas in {cityData.name} yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add one through the admin dashboard to see it here.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
