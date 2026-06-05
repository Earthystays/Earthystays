import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getVillaBySlug } from "@/lib/data/villas";
import { VillaListItem } from "@/components/villa-list-item";
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
  const wishlistSet = new Set(user.wishlist);

  return (
    <div className="container-page py-10 lg:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My wishlist" }]} />
      <header className="mt-4">
        <h1 className="font-display text-4xl sm:text-5xl">My wishlist</h1>
        <p className="mt-2 text-muted-foreground">
          {villas.length === 0
            ? "Nothing saved yet."
            : `${villas.length} ${villas.length === 1 ? "villa" : "villas"} saved.`}
        </p>
      </header>

      {villas.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
          <Heart className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-2xl">Save villas you love</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tap the heart on any villa to keep it here. We&apos;ll remember it across visits.
          </p>
          <Link
            href="/villas"
            className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Browse villas →
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-5">
          {villas.map((v) => (
            <VillaListItem
              key={v.slug}
              villa={v}
              loggedIn
              inWishlist={wishlistSet.has(v.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
