import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getVillaBySlugWithHidden } from "@/lib/data/villas";
import { getPublishedExperienceBySlug } from "@/lib/data/experiences";
import {
  REQUIRE_COMPLETED_BOOKING,
  REVIEW_CATEGORIES,
  submitReview,
  type CategoryRatings,
} from "@/lib/data/reviews";

const MAX_TITLE = 120;
const MAX_BODY = 1000;
const MAX_PHOTOS = 8;

function isStar(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

/** Guest review submission — signed-in users only; lands in moderation. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to leave a review." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const villaSlug = typeof body.villaSlug === "string" ? body.villaSlug : "";
  const experienceSlug =
    typeof body.experienceSlug === "string" ? body.experienceSlug : "";

  // A review targets either a villa or an experience.
  const villa = villaSlug ? getVillaBySlugWithHidden(villaSlug) : undefined;
  const experience = experienceSlug
    ? getPublishedExperienceBySlug(experienceSlug)
    : undefined;
  if (!villa && !experience) {
    return NextResponse.json(
      { ok: false, error: "Listing not found" },
      { status: 404 },
    );
  }

  // Phase 2 seam: once bookings gate reviews, resolve the user's completed
  // booking here and refuse without one (attach bookingId + stay dates).
  if (REQUIRE_COMPLETED_BOOKING) {
    return NextResponse.json(
      { ok: false, error: "Reviews are limited to guests who completed a stay." },
      { status: 403 },
    );
  }

  if (!isStar(body.rating)) {
    return NextResponse.json({ ok: false, error: "Pick an overall rating." }, { status: 400 });
  }
  const quote = typeof body.quote === "string" ? body.quote.trim() : "";
  if (quote.length < 20) {
    return NextResponse.json(
      { ok: false, error: "Tell us a little more — at least 20 characters." },
      { status: 400 },
    );
  }
  if (quote.length > MAX_BODY) {
    return NextResponse.json(
      { ok: false, error: `Reviews are capped at ${MAX_BODY} characters.` },
      { status: 400 },
    );
  }
  const title =
    typeof body.title === "string" ? body.title.trim().slice(0, MAX_TITLE) : undefined;

  const categoryRatings: CategoryRatings = {};
  if (body.categoryRatings && typeof body.categoryRatings === "object") {
    for (const key of REVIEW_CATEGORIES) {
      const v = (body.categoryRatings as Record<string, unknown>)[key];
      if (isStar(v)) categoryRatings[key] = v;
    }
  }

  const photos = Array.isArray(body.photos)
    ? body.photos
        .filter((p): p is string => typeof p === "string" && p.startsWith("/uploads/"))
        .slice(0, MAX_PHOTOS)
    : [];

  const guestName =
    typeof body.guestName === "string" && body.guestName.trim()
      ? body.guestName.trim().slice(0, 80)
      : user.name;
  const country =
    typeof body.country === "string" ? body.country.trim().slice(0, 56) : undefined;
  const stayMonth =
    typeof body.stayMonth === "string" && /^\d{4}-\d{2}$/.test(body.stayMonth)
      ? body.stayMonth
      : undefined;

  const review = await submitReview({
    villaSlug: villa?.slug,
    experienceSlug: experience?.slug,
    userId: user.id,
    guestName,
    email: user.email,
    country,
    stayMonth,
    rating: body.rating,
    title,
    quote,
    categoryRatings:
      Object.keys(categoryRatings).length > 0 ? categoryRatings : undefined,
    photos,
  });

  revalidatePath("/admin/reviews");
  return NextResponse.json({ ok: true, id: review.id, status: review.status });
}
