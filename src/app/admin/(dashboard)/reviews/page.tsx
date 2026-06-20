import { getStoredReviews } from "@/lib/data/reviews";
import { getVillas } from "@/lib/data/villas";
import { ReviewsEditor } from "./editor";

export const metadata = { title: "Reviews · Admin" };

export default function AdminReviewsPage() {
  const reviews = getStoredReviews();
  const villas = getVillas()
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
          Link each review to a property so it shows on the villa page. Toggle
          Featured to surface it on the home page. Mark Inactive to
          temporarily hide without deleting.
        </p>
      </header>

      <ReviewsEditor initial={reviews} villas={villas} />
    </div>
  );
}
