import { getStoredReviews } from "@/lib/data/reviews";
import { ReviewsEditor } from "./editor";

export const metadata = { title: "Reviews · Admin" };

export default function AdminReviewsPage() {
  const reviews = getStoredReviews();

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Reviews</h1>
        <p className="mt-2 text-muted-foreground">
          Manage the testimonials shown on the home page slider. Add 6–8 of your
          best guest reviews — the slider rotates through them automatically.
        </p>
      </header>

      <ReviewsEditor initial={reviews} />
    </div>
  );
}
