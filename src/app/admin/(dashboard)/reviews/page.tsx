import { getStoredReviews } from "@/lib/data/reviews";
import { getVillasWithHidden } from "@/lib/data/villas";
import { ReviewsEditor } from "./editor";
import { ModerationQueue } from "./moderation-queue";

export const metadata = { title: "Reviews · Admin" };
export const dynamic = "force-dynamic";

export default function AdminReviewsPage() {
  const stored = getStoredReviews();
  // Guest submissions carry a moderation status; team-curated records don't.
  const guestSubmitted = stored.filter((r) => r.status !== undefined);
  const curated = stored.filter((r) => r.status === undefined);
  const allVillas = getVillasWithHidden();
  const villaNames = Object.fromEntries(allVillas.map((v) => [v.slug, v.name]));
  const villas = allVillas
    .map((v) => ({
      slug: v.slug,
      name: v.name,
      location: [v.city, v.state].filter(Boolean).join(", "),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Guest Reviews</h1>
        <p className="mt-2 text-muted-foreground">
          Guest submissions land in the moderation queue below — nothing shows
          on the site until you approve it. The editor underneath manages
          team-curated reviews and the home-page Featured picks.
        </p>
      </header>

      <ModerationQueue reviews={guestSubmitted} villaNames={villaNames} />

      <div className="mt-12 border-t border-border/60 pt-8">
        <h2 className="font-display text-2xl">Curated reviews</h2>
        <ReviewsEditor initial={curated} villas={villas} />
      </div>
    </div>
  );
}
