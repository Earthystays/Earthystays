"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  Plus,
  Star,
  Trash2,
  Pencil,
  X,
  Upload,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadButton } from "@/components/image-upload-button";
import { deleteReview, saveReview } from "./actions";
import type { StoredReview } from "@/lib/data/reviews";

const GUEST_TYPES = [
  "Family",
  "Couple",
  "Friends",
  "Corporate",
  "Solo",
] as const;

type VillaOption = { slug: string; name: string; location: string };

export function ReviewsEditor({
  initial,
  villas,
}: {
  initial: StoredReview[];
  villas: VillaOption[];
}) {
  const [editing, setEditing] = useState<StoredReview | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pending, start] = useTransition();

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(r: StoredReview) {
    setEditing(r);
    setShowForm(true);
  }
  function close() {
    setShowForm(false);
    setEditing(null);
  }

  function onDelete(id: string, name: string) {
    if (!confirm(`Delete the review from "${name}"?`)) return;
    start(async () => {
      await deleteReview(id);
      toast.success("Review deleted");
    });
  }

  const featuredCount = initial.filter((r) => r.featured).length;

  return (
    <div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initial.length === 0
            ? "No reviews yet — add one to populate the home page."
            : `${initial.length} ${initial.length === 1 ? "review" : "reviews"} · ${featuredCount} featured on home page.`}
        </p>
        {!showForm && (
          <Button onClick={openNew} className="rounded-full">
            <Plus className="h-4 w-4 mr-1.5" />
            Add review
          </Button>
        )}
      </div>

      {showForm && (
        <ReviewForm initial={editing} villas={villas} onClose={close} />
      )}

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {initial.map((r) => (
          <li
            key={r.id}
            className={`rounded-2xl border p-5 ${
              r.active === false
                ? "border-dashed border-muted-foreground/40 bg-muted/30"
                : "border-border/60 bg-card"
            }`}
          >
            <header className="flex items-start gap-3">
              {r.guestPhoto && r.showPhoto !== false ? (
                <Image
                  src={r.guestPhoto}
                  alt={r.guestName}
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <User className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold text-foreground">
                  {r.guestName}
                </p>
                {(r.villaName || r.location) && (
                  <p className="mt-0.5 truncate text-xs uppercase tracking-wider text-muted-foreground">
                    {[r.villaName, r.location].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5 text-terracotta">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < r.rating ? "fill-terracotta" : "fill-none opacity-30"}`}
                  />
                ))}
              </div>
            </header>

            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wider">
              {r.featured && (
                <span className="rounded-full bg-terracotta/15 px-2 py-0.5 text-terracotta">
                  Featured
                </span>
              )}
              {r.active === false && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  Inactive
                </span>
              )}
              {r.guestType && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-foreground/70">
                  {r.guestType}
                </span>
              )}
            </div>

            {r.title && (
              <p className="mt-3 font-display text-sm font-semibold text-foreground">
                {r.title}
              </p>
            )}
            <p className="mt-2 line-clamp-4 text-sm leading-relaxed italic text-foreground/85">
              &ldquo;{r.quote}&rdquo;
            </p>
            <footer className="mt-4 flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => openEdit(r)}
                className="inline-flex items-center gap-1 text-terracotta hover:underline"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(r.id, r.guestName)}
                disabled={pending}
                className="inline-flex items-center gap-1 text-destructive hover:underline disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </footer>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewForm({
  initial,
  villas,
  onClose,
}: {
  initial: StoredReview | null;
  villas: VillaOption[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveReview, undefined);
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [photo, setPhoto] = useState(initial?.guestPhoto ?? "");
  const [uploading, setUploading] = useState(false);
  const [villaSlug, setVillaSlug] = useState(initial?.villaSlug ?? "");
  const [showPhoto, setShowPhoto] = useState(initial?.showPhoto !== false);
  const [active, setActive] = useState(initial?.active !== false);
  const [featured, setFeatured] = useState(initial?.featured === true);

  const selectedVilla = villas.find((v) => v.slug === villaSlug);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form
      action={action}
      className="mt-6 rounded-2xl border border-border bg-card p-6"
    >
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="guestPhoto" value={photo} />
      <input type="hidden" name="showPhoto" value={showPhoto ? "on" : ""} />
      <input type="hidden" name="active" value={active ? "on" : ""} />
      <input type="hidden" name="featured" value={featured ? "on" : ""} />

      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight">
          {initial ? "Edit review" : "Add a review"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        {/* GUEST */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Guest name <span className="text-terracotta">*</span>
            </Label>
            <Input
              name="guestName"
              placeholder="Priya D."
              defaultValue={initial?.guestName ?? ""}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Guest location (optional)
            </Label>
            <Input
              name="guestLocation"
              placeholder="Mumbai, Maharashtra"
              defaultValue={initial?.guestLocation ?? ""}
            />
          </div>
        </div>

        {/* GUEST PHOTO */}
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Guest photo (optional)
          </Label>
          {photo ? (
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3">
              <Image
                src={photo}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted-foreground">
                  {photo.split("/").pop()}
                </p>
              </div>
              <ImageUploadButton
                label="Replace"
                onUploadStart={() => setUploading(true)}
                onUploaded={(url) => {
                  setUploading(false);
                  setPhoto(url);
                }}
              />
              <button
                type="button"
                onClick={() => setPhoto("")}
                className="text-xs text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
              {uploading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload
                  className="mx-auto h-5 w-5 text-muted-foreground"
                  strokeWidth={1.5}
                />
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {uploading
                  ? "Uploading…"
                  : "Square crop recommended (JPG / PNG / WEBP)"}
              </p>
              <div className="mt-2.5">
                <ImageUploadButton
                  label="Upload photo"
                  onUploadStart={() => setUploading(true)}
                  onUploaded={(url) => {
                    setUploading(false);
                    setPhoto(url);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* VILLA */}
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Villa
          </Label>
          <select
            name="villaSlug"
            value={villaSlug}
            onChange={(e) => setVillaSlug(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">— Not linked to a property —</option>
            {villas.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.name}
                {v.location ? ` · ${v.location}` : ""}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            When linked, the property name + destination auto-populate from
            the villa record and the review shows up on that villa&apos;s
            page. Otherwise use the free-text fields below.
          </p>
        </div>

        {/* FALLBACK villa name + destination, only useful when no slug is linked */}
        {!villaSlug && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Villa name (free text)
              </Label>
              <Input
                name="villaName"
                placeholder="Casa Azul"
                defaultValue={initial?.villaName ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Destination (free text)
              </Label>
              <Input
                name="location"
                placeholder="Anjuna, Goa"
                defaultValue={initial?.location ?? ""}
              />
            </div>
          </div>
        )}
        {villaSlug && selectedVilla && (
          <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Linked to{" "}
            <span className="font-medium text-foreground">
              {selectedVilla.name}
            </span>{" "}
            in {selectedVilla.location || "—"}.
          </p>
        )}

        {/* STAY MONTH + GUEST TYPE */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Stay month (optional)
            </Label>
            <Input
              name="stayMonth"
              type="month"
              defaultValue={initial?.stayMonth ?? ""}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Guest type (optional)
            </Label>
            <select
              name="guestType"
              defaultValue={initial?.guestType ?? ""}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Not set —</option>
              {GUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RATING */}
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Rating
          </Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="inline-flex items-center justify-center p-1"
              >
                <Star
                  className={`h-6 w-6 ${
                    n <= rating
                      ? "fill-terracotta text-terracotta"
                      : "fill-none text-muted-foreground"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-xs text-muted-foreground">
              {rating}/5
            </span>
          </div>
        </div>

        {/* TITLE */}
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Review title (optional)
          </Label>
          <Input
            name="title"
            placeholder="Amazing stay with incredible support"
            defaultValue={initial?.title ?? ""}
          />
        </div>

        {/* QUOTE */}
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Review content <span className="text-terracotta">*</span>
          </Label>
          <Textarea
            name="quote"
            rows={5}
            placeholder="The kind of place where you arrive a little frayed and leave with your shoulders down…"
            defaultValue={initial?.quote ?? ""}
            required
          />
        </div>

        {/* TOGGLES */}
        <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 sm:grid-cols-3">
          <Toggle
            checked={featured}
            onChange={setFeatured}
            label="Featured"
            hint="Show on home page"
          />
          <Toggle
            checked={showPhoto}
            onChange={setShowPhoto}
            label="Show guest photo"
            hint="Hide if guest opted out"
          />
          <Toggle
            checked={active}
            onChange={setActive}
            label="Active"
            hint="Visible on the site"
          />
        </div>

        {state && !state.ok && state.error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending} className="rounded-md">
            {pending ? "Saving…" : initial ? "Save changes" : "Add review"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-background">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-primary"
      />
      <span className="grid">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </span>
    </label>
  );
}
