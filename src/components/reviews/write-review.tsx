"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  PenLine,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  REVIEW_CATEGORIES,
  CATEGORY_LABELS,
  type ReviewCategory,
} from "@/lib/reviews-shared";

const MAX_PHOTOS = 8;
const MAX_BODY = 1000;
const RATING_WORDS = ["", "Terrible", "Fair", "Good", "Great", "Excellent"];
const STEPS = ["Your review", "Photos", "Your details", "Done"];

export type Viewer = { name: string; email: string } | null;

/* ---------------------------------------------------------------- */

function StarPicker({
  value,
  onChange,
  size = "h-8 w-8",
}: {
  value: number;
  onChange: (n: number) => void;
  size?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Star
            className={`${size} transition-colors ${
              n <= shown ? "fill-terracotta text-terracotta" : "text-border"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function WriteReviewButton({
  villaSlug,
  villaName,
  experienceSlug,
  reviewPath,
  viewer,
  variant = "solid",
}: {
  villaSlug?: string;
  villaName: string;
  /** Set for experience reviews instead of villaSlug. */
  experienceSlug?: string;
  /** Path to return to after login (defaults to the villa detail page). */
  reviewPath?: string;
  viewer: Viewer;
  variant?: "solid" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const nextPath = reviewPath ?? `/villas/${villaSlug}#reviews`;
  const cls =
    variant === "solid"
      ? "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      : "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted";

  if (!viewer) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(nextPath)}`}
        className={cls}
      >
        <PenLine className="h-4 w-4" />
        Write a review
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cls}>
        <PenLine className="h-4 w-4" />
        Write a review
      </button>
      {open && (
        <WriteReviewModal
          villaSlug={villaSlug}
          villaName={villaName}
          experienceSlug={experienceSlug}
          viewer={viewer}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/* ---------------------------------------------------------------- */

function WriteReviewModal({
  villaSlug,
  villaName,
  experienceSlug,
  viewer,
  onClose,
}: {
  villaSlug?: string;
  villaName: string;
  experienceSlug?: string;
  viewer: NonNullable<Viewer>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cats, setCats] = useState<Partial<Record<ReviewCategory, number>>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(viewer.name);
  const [country, setCountry] = useState("");
  const [stayMonth, setStayMonth] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stepReady =
    step === 0
      ? rating >= 1 && body.trim().length >= 20
      : step === 2
        ? name.trim().length >= 2 && confirmed
        : true;

  async function handleFiles(files: FileList | File[]) {
    const room = MAX_PHOTOS - photos.length;
    const batch = [...files].slice(0, room);
    if (batch.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      for (const f of batch) fd.append("file", f);
      const res = await fetch("/api/reviews/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Upload failed");
      setPhotos((p) => [...p, ...data.files.map((f: { url: string }) => f.url)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed — try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function movePhoto(i: number, dir: -1 | 1) {
    setPhotos((p) => {
      const next = [...p];
      const j = i + dir;
      if (j < 0 || j >= next.length) return p;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            villaSlug,
            experienceSlug,
            rating,
            title,
            quote: body,
            categoryRatings: cats,
            photos,
            guestName: name,
            country,
            stayMonth,
          }),
        });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error ?? "Something went wrong — try again.");
          return;
        }
        setStep(3);
        router.refresh();
      } catch {
        setError("Something went wrong — try again.");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-dvh max-h-dvh w-full max-w-full flex-col gap-0 overflow-hidden rounded-none bg-background p-0 sm:h-auto sm:max-h-[92dvh] sm:max-w-[720px] sm:rounded-3xl"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-8">
          <div>
            <DialogTitle className="font-display text-xl sm:text-2xl">
              {step === 3 ? "Thank you!" : "Share your experience"}
            </DialogTitle>
            {step < 3 && (
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {villaName} · Step {step + 1} of 3 — {STEPS[step]}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* progress */}
        {step < 3 && (
          <div className="h-1 w-full bg-muted">
            <div
              className="h-1 bg-primary transition-all duration-300"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
        )}

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {step === 0 && (
            <div className="space-y-7">
              <div>
                <p className="text-sm font-medium">
                  Overall rating <span className="text-terracotta">*</span>
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <StarPicker value={rating} onChange={setRating} size="h-9 w-9" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {RATING_WORDS[rating]}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="rv-title" className="text-sm font-medium">
                  Review title <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="rv-title"
                  type="text"
                  value={title}
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience in a few words"
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="rv-body" className="text-sm font-medium">
                    Your review <span className="text-terracotta">*</span>
                  </label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {body.length}/{MAX_BODY}
                  </span>
                </div>
                <textarea
                  id="rv-body"
                  value={body}
                  maxLength={MAX_BODY}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="What did you like? How was the cleanliness, location, host? Any tips for future guests?"
                  className="mt-2 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Category ratings <span className="text-muted-foreground">(optional)</span>
                </p>
                <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {REVIEW_CATEGORIES.map((key) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        {CATEGORY_LABELS[key]}
                      </span>
                      <StarPicker
                        value={cats[key] ?? 0}
                        onChange={(n) => setCats((c) => ({ ...c, [key]: n }))}
                        size="h-5 w-5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium">
                  Add photos <span className="text-muted-foreground">(optional)</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Up to {MAX_PHOTOS} photos · JPG, PNG or WEBP, 10MB each
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
                disabled={uploading || photos.length >= MAX_PHOTOS}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <ImagePlus className="h-7 w-7" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {uploading ? "Uploading…" : "Click to upload or drag & drop"}
                </span>
                <span className="text-xs">
                  {photos.length}/{MAX_PHOTOS} added
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />

              {photos.length > 0 && (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {photos.map((src, i) => (
                    <li key={src} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex gap-0.5">
                          <button
                            type="button"
                            aria-label="Move earlier"
                            onClick={() => movePhoto(i, -1)}
                            className="rounded-md p-1 text-white/90 hover:bg-white/20 disabled:opacity-30"
                            disabled={i === 0}
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Move later"
                            onClick={() => movePhoto(i, 1)}
                            className="rounded-md p-1 text-white/90 hover:bg-white/20 disabled:opacity-30"
                            disabled={i === photos.length - 1}
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove photo"
                          onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                          className="rounded-md p-1 text-white/90 hover:bg-white/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="rv-name" className="text-sm font-medium">
                    Name <span className="text-terracotta">*</span>
                  </label>
                  <input
                    id="rv-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="mt-2 flex h-11 items-center rounded-xl bg-muted/50 px-4 text-sm text-muted-foreground">
                    {viewer.email}
                  </p>
                </div>
                <div>
                  <label htmlFor="rv-country" className="text-sm font-medium">
                    Country <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    id="rv-country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India"
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <div>
                  <label htmlFor="rv-stay" className="text-sm font-medium">
                    When did you stay? <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    id="rv-stay"
                    type="month"
                    value={stayMonth}
                    max={new Date().toISOString().slice(0, 7)}
                    onChange={(e) => setStayMonth(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-muted/40 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm leading-relaxed text-muted-foreground">
                  I confirm this review is based on my genuine experience at {villaName}.
                </span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-8 w-8" />
              </span>
              <p className="mt-5 font-display text-2xl">Your review has been received</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                It&apos;s currently under moderation and will appear on the listing once
                our team approves it — usually within 24 hours.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-7 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Return to listing
              </button>
            </div>
          )}

          {error && step < 3 && (
            <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* footer */}
        {step < 3 && (
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || pending}
              className="text-sm font-medium underline underline-offset-4 disabled:opacity-40"
            >
              Back
            </button>
            {step < 2 ? (
              <button
                type="button"
                onClick={() => stepReady && setStep((s) => s + 1)}
                disabled={!stepReady || uploading}
                className="rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!stepReady || pending}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit review
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
