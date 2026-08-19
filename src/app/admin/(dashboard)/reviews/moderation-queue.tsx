"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  Flag,
  Loader2,
  MessageSquareReply,
  Search,
  Star,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORY_LABELS,
  formatStayMonth,
  REVIEW_CATEGORIES,
  type ReviewStatus,
  type StoredReview,
} from "@/lib/reviews-shared";
import { deleteReview, moderateReview, replyToReview } from "./actions";

type Tab = ReviewStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "spam", label: "Spam" },
];

const DATE_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-terracotta">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= value ? "fill-terracotta" : "fill-none opacity-35"}`}
        />
      ))}
    </span>
  );
}

export function ModerationQueue({
  reviews,
  villaNames,
}: {
  /** Guest-submitted reviews only (records carrying a status). */
  reviews: StoredReview[];
  villaNames: Record<string, string>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const [villaFilter, setVillaFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { pending: 0, approved: 0, rejected: 0, spam: 0 };
    for (const r of reviews) c[(r.status ?? "approved") as Tab]++;
    return c;
  }, [reviews]);

  const villaOptions = useMemo(() => {
    const set = new Set(reviews.map((r) => r.villaSlug).filter(Boolean) as string[]);
    return [...set].sort((a, b) =>
      (villaNames[a] ?? a).localeCompare(villaNames[b] ?? b),
    );
  }, [reviews, villaNames]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews
      .filter((r) => (r.status ?? "approved") === tab)
      .filter((r) => villaFilter === "all" || r.villaSlug === villaFilter)
      .filter((r) => ratingFilter === 0 || r.rating === ratingFilter)
      .filter(
        (r) =>
          !q ||
          [r.guestName, r.email ?? "", r.title ?? "", r.quote]
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reviews, tab, query, villaFilter, ratingFilter]);

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    setBusyId(id);
    start(async () => {
      const res = await fn();
      setBusyId(null);
      if (!res.ok) {
        toast.error(res.error ?? "Something went wrong");
        return;
      }
      toast.success(okMsg);
      router.refresh();
    });
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="admin-section-title">Moderation queue</h2>
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.key
                  ? "border-[#3E4A3A] bg-[#3E4A3A] text-white"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span className="admin-numeric ml-1.5 opacity-70">{counts[t.key]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or text…"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          value={villaFilter}
          onChange={(e) => setVillaFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
        >
          <option value="all">All properties</option>
          {villaOptions.map((slug) => (
            <option key={slug} value={slug}>
              {villaNames[slug] ?? slug}
            </option>
          ))}
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(Number(e.target.value))}
          className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
        >
          <option value={0}>All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-xl bg-muted/40 px-5 py-10 text-center text-sm text-muted-foreground">
          Nothing in {TABS.find((t) => t.key === tab)?.label.toLowerCase()}.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {filtered.map((r) => {
            const busy = busyId === r.id && pending;
            return (
              <li key={r.id} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {r.guestName}
                      <span className="font-normal text-muted-foreground">
                        {r.email}
                      </span>
                      {(r.reportCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                          <Flag className="h-3 w-3" />
                          Reported ×{r.reportCount}
                        </span>
                      )}
                    </p>
                    <p className="admin-numeric mt-0.5 text-xs text-muted-foreground">
                      {[
                        r.villaSlug && (villaNames[r.villaSlug] ?? r.villaSlug),
                        r.country,
                        r.stayMonth && `Stayed ${formatStayMonth(r.stayMonth)}`,
                        `Posted ${DATE_FMT.format(new Date(r.createdAt))}`,
                        (r.helpfulCount ?? 0) > 0 && `${r.helpfulCount} helpful`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Stars value={r.rating} />
                </div>

                {r.title && <p className="mt-3 text-sm font-semibold">{r.title}</p>}
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.quote}</p>

                {r.categoryRatings && (
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {REVIEW_CATEGORIES.filter((k) => r.categoryRatings?.[k]).map((k) => (
                      <span key={k}>
                        {CATEGORY_LABELS[k]}{" "}
                        <strong className="text-foreground">{r.categoryRatings![k]}</strong>
                      </span>
                    ))}
                  </p>
                )}

                {r.photos && r.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {r.photos.map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={src} href={src} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt="Review photo"
                          className="h-16 w-20 shrink-0 rounded-lg object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {r.reply && (
                  <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    <strong className="text-foreground">Team reply:</strong> {r.reply.text}
                  </p>
                )}

                {/* actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      {tab !== "approved" && (
                        <button
                          type="button"
                          onClick={() =>
                            run(r.id, () => moderateReview(r.id, "approved"), "Review approved — it's live.")
                          }
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:opacity-90"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      )}
                      {tab !== "rejected" && (
                        <button
                          type="button"
                          onClick={() =>
                            run(r.id, () => moderateReview(r.id, "rejected"), "Review rejected.")
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 font-medium hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      )}
                      {tab !== "spam" && (
                        <button
                          type="button"
                          onClick={() =>
                            run(r.id, () => moderateReview(r.id, "spam"), "Marked as spam.")
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 font-medium hover:bg-muted"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Spam
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyFor(replyFor === r.id ? null : r.id);
                          setReplyText(r.reply?.text ?? "");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 font-medium hover:bg-muted"
                      >
                        <MessageSquareReply className="h-3.5 w-3.5" />
                        {r.reply ? "Edit reply" : "Reply"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm(`Delete this review by ${r.guestName}? This can't be undone.`)) return;
                          run(r.id, () => deleteReview(r.id).then(() => ({ ok: true })), "Review deleted.");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                      {(r.helpfulCount ?? 0) > 0 && (
                        <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
                          <ThumbsUp className="h-3 w-3" />
                          {r.helpfulCount}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {replyFor === r.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Public reply from the Earthy Stays team…"
                      className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        run(r.id, () => replyToReview(r.id, replyText), replyText.trim() ? "Reply posted." : "Reply removed.");
                        setReplyFor(null);
                      }}
                      className="rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90"
                    >
                      Save
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
