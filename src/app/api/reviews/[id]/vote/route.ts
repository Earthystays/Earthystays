import { NextResponse } from "next/server";
import { getReviews, incrementHelpful, isPublicReview, reportReview } from "@/lib/data/reviews";

/** Helpful votes + reports on a public review. One per browser is
 *  enforced client-side (localStorage) — good enough for phase 1. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const review = getReviews().find((r) => r.id === id);
  if (!review || !isPublicReview(review)) {
    return NextResponse.json({ ok: false, error: "Review not found" }, { status: 404 });
  }

  let action = "helpful";
  try {
    const body = await req.json();
    if (body?.action === "report") action = "report";
  } catch {
    /* default to helpful */
  }

  if (action === "report") {
    await reportReview(id);
    return NextResponse.json({ ok: true });
  }
  const count = await incrementHelpful(id);
  return NextResponse.json({ ok: true, helpfulCount: count });
}
