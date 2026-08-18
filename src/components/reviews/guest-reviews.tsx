"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Flag, Search, Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import {
  formatStayMonth,
  type ReviewSummary,
  type StoredReview,
} from "@/lib/reviews-shared";
import { WriteReviewButton, type Viewer } from "./write-review";

type SortKey = "newest" | "highest" | "lowest" | "helpful" | "photos";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "highest", label: "Highest rated" },
  { key: "lowest", label: "Lowest rated" },
  { key: "helpful", label: "Most helpful" },
  { key: "photos", label: "With photos" },
];

const INITIAL_SHOWN = 4;
const VOTES_KEY = "es-review-votes";

function votedSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(VOTES_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function markVoted(id: string) {
  const s = votedSet();
  s.add(id);
  localStorage.setItem(VOTES_KEY, JSON.stringify([...s]));
}

function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5 text-terracotta" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${n <= Math.round(value) ? "fill-terracotta" : "fill-none opacity-35"}`}
        />
      ))}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initials || "G"}
    </span>
  );
}

const POSTED_FMT = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
});

/** Platform chip shown on imported reviews — StayVista-style provenance. */
const SOURCE_META: Record<string, { label: string; dot: string }> = {
  google: { label: "Google", dot: "#4285F4" },
  airbnb: { label: "Airbnb", dot: "#FF385C" },
  booking: { label: "Booking.com", dot: "#003B95" },
};

function SourceBadge({ source }: { source?: string }) {
  const meta = source ? SOURCE_META[source] : undefined;
  if (!meta) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-foreground">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.dot }}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}

export function GuestReviews({
  villaSlug,
  villaName,
  experienceSlug,
  reviewPath,
  reviews,
  summary,
  fallbackRating,
  fallbackCount,
  viewer,
}: {
  villaSlug?: string;
  villaName: string;
  /** Set for experience reviews instead of villaSlug. */
  experienceSlug?: string;
  /** Login-return path (defaults to the villa detail page). */
  reviewPath?: string;
  reviews: StoredReview[];
  summary: ReviewSummary;
  /** Record rating shown until real guest reviews exist. */
  fallbackRating: number;
  fallbackCount: number;
  viewer: Viewer;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [showAll, setShowAll] = useState(false);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [helpful, setHelpful] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Hydrate the per-browser voted set after mount (localStorage).
  useEffect(() => {
    setVoted(votedSet());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = reviews;
    if (q) {
      list = list.filter((r) =>
        [r.title ?? "", r.quote, r.guestName].join(" ").toLowerCase().includes(q),
      );
    }
    const by = {
      newest: (a: StoredReview, b: StoredReview) => b.createdAt.localeCompare(a.createdAt),
      highest: (a: StoredReview, b: StoredReview) =>
        b.rating - a.rating || b.createdAt.localeCompare(a.createdAt),
      lowest: (a: StoredReview, b: StoredReview) =>
        a.rating - b.rating || b.createdAt.localeCompare(a.createdAt),
      helpful: (a: StoredReview, b: StoredReview) =>
        (b.helpfulCount ?? 0) - (a.helpfulCount ?? 0),
      photos: (a: StoredReview, b: StoredReview) =>
        (b.photos?.length ?? 0) - (a.photos?.length ?? 0) ||
        b.createdAt.localeCompare(a.createdAt),
    }[sort];
    return [...list].sort(by);
  }, [reviews, query, sort]);

  const shown = showAll ? filtered : filtered.slice(0, INITIAL_SHOWN);
  const hasReviews = reviews.length > 0;

  async function vote(id: string, action: "helpful" | "report") {
    if (voted.has(`${action}:${id}`)) return;
    try {
      const res = await fetch(`/api/reviews/${id}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.ok) return;
      markVoted(`${action}:${id}`);
      setVoted(votedSet());
      if (action === "helpful") {
        setHelpful((h) => ({ ...h, [id]: data.helpfulCount }));
      } else {
        toast.success("Thanks — our team will take a look.");
      }
    } catch {
      /* silent */
    }
  }

  return (
    <div>
      {/* summary header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <p className="font-numeric text-5xl font-semibold tabular-nums tracking-tight">
            {(hasReviews ? summary.average : fallbackRating).toFixed(1)}
          </p>
          <div>
            <Stars value={hasReviews ? summary.average : fallbackRating} />
            <p className="mt-1 text-sm font-medium">
              {hasReviews ? summary.count : fallbackCount}{" "}
              {(hasReviews ? summary.count : fallbackCount) === 1 ? "review" : "reviews"}
            </p>
            <p className="text-xs text-muted-foreground">Based on guest experiences</p>
          </div>
        </div>
        <WriteReviewButton
          villaSlug={villaSlug}
          villaName={villaName}
          experienceSlug={experienceSlug}
          reviewPath={reviewPath}
          viewer={viewer}
        />
      </div>

      {/* category ratings */}
      {summary.categories.length > 0 && (
        <div className="mt-7 grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-3">
          {summary.categories.map((c) => (
            <div key={c.key}>
              <div className="flex items-baseline justify-between">
                <p className="text-sm">{c.label}</p>
                <p className="text-sm font-semibold tabular-nums">{c.average.toFixed(1)}</p>
              </div>
              <div className="mt-1.5 h-1 w-full rounded-full bg-muted">
                <div
                  className="h-1 rounded-full bg-foreground/80"
                  style={{ width: `${(c.average / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* controls */}
      {hasReviews && (
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviews…"
              className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  sort === s.key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* cards */}
      {hasReviews ? (
        filtered.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-muted/40 px-5 py-8 text-center text-sm text-muted-foreground">
            No reviews match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <ul className="mt-7 space-y-5">
            {shown.map((r) => {
              const count = helpful[r.id] ?? r.helpfulCount ?? 0;
              const votedHelpful = voted.has(`helpful:${r.id}`);
              const votedReport = voted.has(`report:${r.id}`);
              return (
                <li
                  key={r.id}
                  className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/50 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {r.guestPhoto && r.showPhoto !== false ? (
                        <Image
                          src={r.guestPhoto}
                          alt={r.guestName}
                          width={44}
                          height={44}
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <Initials name={r.guestName} />
                      )}
                      <div>
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {r.guestName}
                          {r.bookingId && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              Verified stay
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            r.country || r.guestLocation,
                            r.stayMonth && `Stayed ${formatStayMonth(r.stayMonth)}`,
                            POSTED_FMT.format(new Date(r.createdAt)),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                    <Stars value={r.rating} className="h-3.5 w-3.5" />
                  </div>

                  {r.title && <p className="mt-4 text-[15px] font-semibold">{r.title}</p>}
                  <p className={`${r.title ? "mt-1.5" : "mt-4"} text-sm leading-relaxed text-muted-foreground`}>
                    {r.quote}
                  </p>

                  {r.photos && r.photos.length > 0 && (
                    <ul className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
                      {r.photos.map((src) => (
                        <li key={src} className="shrink-0">
                          <button
                            type="button"
                            onClick={() => setLightbox(src)}
                            className="block overflow-hidden rounded-xl"
                            aria-label="View photo"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt="Guest photo"
                              className="h-24 w-32 object-cover transition-transform hover:scale-105"
                              loading="lazy"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {r.reply && (
                    <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3.5">
                      <p className="text-xs font-semibold">
                        Response from {r.reply.by === "host" ? "the host" : "Earthy Stays"}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {r.reply.text}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <SourceBadge source={r.source} />
                    {/* Google pseudo-reviews live in a cache, not our store —
                        votes can't attach to them. */}
                    {!r.id.startsWith("gplace_") && (
                      <>
                        <button
                          type="button"
                          onClick={() => vote(r.id, "helpful")}
                          disabled={votedHelpful}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors ${
                            votedHelpful ? "text-primary" : "hover:text-foreground"
                          }`}
                        >
                          <ThumbsUp className={`h-3.5 w-3.5 ${votedHelpful ? "fill-primary/20" : ""}`} />
                          Helpful{count > 0 ? ` (${count})` : ""}
                        </button>
                        <button
                          type="button"
                          onClick={() => vote(r.id, "report")}
                          disabled={votedReport}
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:text-foreground disabled:opacity-50"
                        >
                          <Flag className="h-3.5 w-3.5" />
                          {votedReport ? "Reported" : "Report"}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <div className="mt-7 rounded-2xl bg-muted/40 px-6 py-10 text-center">
          <p className="font-display text-xl">No guest reviews yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            {experienceSlug ? "Been on this experience" : `Stayed at ${villaName}`}?
            Be the first to share your experience with future guests.
          </p>
        </div>
      )}

      {filtered.length > INITIAL_SHOWN && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-6 w-full rounded-full border border-border bg-background py-3 text-sm font-medium transition-colors hover:bg-muted sm:w-auto sm:px-8"
        >
          View all {filtered.length} reviews
        </button>
      )}

      {/* lightbox */}
      {lightbox && (
        <button
          type="button"
          aria-label="Close photo"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Guest photo"
            className="max-h-[90dvh] max-w-full rounded-2xl object-contain"
          />
        </button>
      )}
    </div>
  );
}
