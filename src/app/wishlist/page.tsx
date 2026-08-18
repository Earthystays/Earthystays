import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getVillaBySlug } from "@/lib/data/villas";
import { getExperienceBySlug } from "@/lib/data/experiences";
import { VillaListItem } from "@/components/villa-list-item";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { getCategoryBySlug } from "@/lib/data/experience-categories";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = { title: "My wishlist" };

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/wishlist");
  }

  const villas = user.wishlist
    .map((slug) => getVillaBySlug(slug))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
  const experiences = user.wishlist
    .map((slug) => getExperienceBySlug(slug))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));
  const wishlistSet = new Set(user.wishlist);
  const totalSaved = villas.length + experiences.length;

  return (
    <div className="container-page py-10 lg:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My wishlist" }]} />
      <header className="mt-4">
        <h1 className="font-display text-4xl sm:text-5xl">My wishlist</h1>
        <p className="mt-2 text-muted-foreground">
          {totalSaved === 0
            ? "Nothing saved yet."
            : [
                villas.length > 0 && `${villas.length} ${villas.length === 1 ? "villa" : "villas"}`,
                experiences.length > 0 &&
                  `${experiences.length} ${experiences.length === 1 ? "experience" : "experiences"}`,
              ]
                .filter(Boolean)
                .join(" and ") + " saved."}
        </p>
      </header>

      {totalSaved === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
          <Heart className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-2xl">Save villas and experiences you love</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tap the heart on any villa or experience to keep it here. We&apos;ll remember it across visits.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/villas"
              className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse villas →
            </Link>
            <Link
              href="/experiences"
              className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Browse experiences →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {villas.length > 0 && (
            <div className="mt-10 grid gap-5">
              {villas.map((v, idx) => (
                <VillaListItem
                  key={v.slug}
                  villa={v}
                  loggedIn
                  inWishlist={wishlistSet.has(v.slug)}
                  index={idx}
                />
              ))}
            </div>
          )}

          {experiences.length > 0 && (
            <div className={villas.length > 0 ? "mt-14" : "mt-10"}>
              {villas.length > 0 && (
                <h2 className="font-display text-2xl">Experiences</h2>
              )}
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {experiences.map((e) => (
                  <ExperienceCard
                    key={e.slug}
                    experience={e}
                    categoryName={getCategoryBySlug(e.category ?? "")?.name}
                    loggedIn
                    inWishlist={wishlistSet.has(e.slug)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
