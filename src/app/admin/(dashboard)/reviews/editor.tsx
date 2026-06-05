"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Plus, Star, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { deleteReview, saveReview } from "./actions";
import type { StoredReview } from "@/lib/data/reviews";

export function ReviewsEditor({ initial }: { initial: StoredReview[] }) {
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

  return (
    <div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initial.length === 0
            ? "No reviews yet — add one to populate the home page slider."
            : `${initial.length} ${initial.length === 1 ? "review" : "reviews"} on the home page.`}
        </p>
        {!showForm && (
          <Button onClick={openNew} className="rounded-full">
            <Plus className="h-4 w-4 mr-1.5" />
            Add review
          </Button>
        )}
      </div>

      {showForm && <ReviewForm initial={editing} onClose={close} />}

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {initial.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-border/60 bg-card p-5"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-base font-semibold text-foreground">
                  {r.guestName}
                </p>
                {(r.villaName || r.location) && (
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
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
            <p className="mt-3 text-sm leading-relaxed text-foreground/85 italic">
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
  onClose,
}: {
  initial: StoredReview | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveReview, undefined);
  const [rating, setRating] = useState(initial?.rating ?? 5);

  // Close form on successful save (effect, not render-time call, so we don't
  // update the parent during a child render).
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
        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Guest name <span className="text-terracotta">*</span>
          </Label>
          <Input
            name="guestName"
            placeholder="Aanya & Rohit · The Mehta family"
            defaultValue={initial?.guestName ?? ""}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Villa name (optional)
            </Label>
            <Input
              name="villaName"
              placeholder="Casa Azul"
              defaultValue={initial?.villaName ?? ""}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Location (optional)
            </Label>
            <Input
              name="location"
              placeholder="Goa"
              defaultValue={initial?.location ?? ""}
            />
          </div>
        </div>

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

        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Review quote <span className="text-terracotta">*</span>
          </Label>
          <Textarea
            name="quote"
            rows={4}
            placeholder="The kind of place where you arrive a little frayed and leave with your shoulders down…"
            defaultValue={initial?.quote ?? ""}
            required
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
