import { Star } from "lucide-react";
import { requireHost } from "@/lib/host-auth";
import { getVillasByHost } from "@/lib/data/villas";
import { getReviewsByVilla } from "@/lib/data/reviews";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews · Hosting" };

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < n ? "fill-amber-400 text-amber-400" : "text-border"}`}
        />
      ))}
    </span>
  );
}

export default async function HostReviewsPage() {
  const user = await requireHost();
  const listings = getVillasByHost(user.id);
  const reviews = listings.flatMap((l) =>
    getReviewsByVilla(l.slug).map((r) => ({ review: r, listing: l })),
  );

  const avg =
    reviews.length > 0
      ? Math.round((reviews.reduce((n, r) => n + r.review.rating, 0) / reviews.length) * 10) / 10
      : null;

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 lg:px-8">
      <h1 className="font-display text-3xl sm:text-4xl">Reviews</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        {avg !== null
          ? `${avg} average across ${reviews.length} review${reviews.length === 1 ? "" : "s"} on your listings.`
          : "Guest reviews collected by the Earthy Stays team appear here."}
      </p>

      {reviews.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <Star className="mx-auto h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            No reviews yet. After each stay the concierge team invites guests to review — reviews
            for your listings will show up here.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {reviews.map(({ review: r, listing }) => (
            <div key={r.id} className="rounded-2xl border border-border/60 bg-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-[13px] font-medium text-primary">
                    {r.guestName
                      .split(/\s+/)
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{r.guestName}</p>
                    <p className="text-xs text-muted-foreground">{listing.name}</p>
                  </div>
                </div>
                <Stars n={r.rating} />
              </div>
              {r.title && <p className="mt-3 text-[15px] font-medium">{r.title}</p>}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">“{r.quote}”</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
