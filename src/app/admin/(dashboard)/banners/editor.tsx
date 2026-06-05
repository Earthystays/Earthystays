"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Upload, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadButton } from "@/components/image-upload-button";
import { toast } from "sonner";
import type { HeroSlide } from "@/components/hero-slider";
import { saveBanners, resetBanners, type SaveBannersState } from "./actions";

const INITIAL: SaveBannersState = { ok: false };

type Slide = {
  imageSrc: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  chip: string;
  href: string;
};

function toForm(s: HeroSlide): Slide {
  return {
    imageSrc: s.image.src,
    imageAlt: s.image.alt,
    eyebrow: s.eyebrow ?? "",
    title: s.title,
    subtitle: s.subtitle ?? "",
    chip: s.chip ?? "",
    href: s.href,
  };
}

const BLANK: Slide = {
  imageSrc: "",
  imageAlt: "",
  eyebrow: "",
  title: "",
  subtitle: "",
  chip: "",
  href: "/villas",
};

export function BannerEditor({ initial }: { initial: HeroSlide[] }) {
  const [slides, setSlides] = useState<Slide[]>(initial.map(toForm));
  const [state, action, pending] = useActionState(saveBanners, INITIAL);
  const [resetPending, startReset] = useTransition();

  function patch(i: number, key: keyof Slide, value: string) {
    setSlides((curr) => curr.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  }
  function add() {
    setSlides((c) => [...c, { ...BLANK }]);
  }
  function remove(i: number) {
    setSlides((c) => c.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setSlides((c) => {
      const j = i + dir;
      if (j < 0 || j >= c.length) return c;
      const copy = [...c];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function onReset() {
    if (!confirm("Reset banners to the bundled seed slides? Your edits will be lost.")) return;
    startReset(async () => {
      const res = await resetBanners();
      if (res.ok) {
        toast.success(res.message ?? "Reset");
        // Reload to pick up reset state
        window.location.reload();
      } else {
        toast.error(res.error ?? "Could not reset");
      }
    });
  }

  // Side effect: show toast on success
  if (state.ok && state.message) {
    setTimeout(() => toast.success(state.message!), 0);
    // clear by stuffing; here we just rely on re-render
  } else if (state.error) {
    setTimeout(() => toast.error(state.error!), 0);
  }

  return (
    <form action={action} className="mt-8 grid gap-6">
      <input type="hidden" name="count" value={slides.length} />

      {slides.map((s, i) => (
        <div key={i} className="grid gap-4 rounded-2xl border border-border/60 bg-card p-5">
          <header className="flex items-center justify-between">
            <h3 className="font-display text-lg">Slide {i + 1}</h3>
            <div className="flex items-center gap-1">
              <IconBtn aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp className="h-4 w-4" />
              </IconBtn>
              <IconBtn aria-label="Move down" onClick={() => move(i, 1)} disabled={i === slides.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </IconBtn>
              <IconBtn aria-label="Delete" onClick={() => remove(i)} className="text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </IconBtn>
            </div>
          </header>

          <Field name={`slides.${i}.imageSrc`} label="Banner image">
            <BannerImageField
              src={s.imageSrc}
              alt={s.imageAlt}
              onUploaded={(url, name) => {
                patch(i, "imageSrc", url);
                if (!s.imageAlt) patch(i, "imageAlt", name.replace(/\.[a-z]+$/i, ""));
              }}
              onRemove={() => patch(i, "imageSrc", "")}
            />
            {/* hidden field so the form submit picks up the URL */}
            <input
              type="hidden"
              name={`slides.${i}.imageSrc`}
              value={s.imageSrc}
            />
          </Field>
          <Field name={`slides.${i}.imageAlt`} label="Alt text">
            <Input
              name={`slides.${i}.imageAlt`}
              value={s.imageAlt}
              onChange={(e) => patch(i, "imageAlt", e.target.value)}
              required
              placeholder="Pool at sunset"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name={`slides.${i}.eyebrow`} label="Eyebrow (small label above title)">
              <Input
                name={`slides.${i}.eyebrow`}
                value={s.eyebrow}
                onChange={(e) => patch(i, "eyebrow", e.target.value)}
                placeholder="Now booking"
              />
            </Field>
            <Field name={`slides.${i}.title`} label="Title">
              <Input
                name={`slides.${i}.title`}
                value={s.title}
                onChange={(e) => patch(i, "title", e.target.value)}
                required
                placeholder="Newly Launched Villas"
              />
            </Field>
          </div>

          <Field name={`slides.${i}.subtitle`} label="Subtitle (optional)">
            <Textarea
              name={`slides.${i}.subtitle`}
              value={s.subtitle}
              onChange={(e) => patch(i, "subtitle", e.target.value)}
              rows={2}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name={`slides.${i}.chip`} label="Chip text (CTA button)">
              <Input
                name={`slides.${i}.chip`}
                value={s.chip}
                onChange={(e) => patch(i, "chip", e.target.value)}
                placeholder="Up to 25% off introductory rates*"
              />
            </Field>
            <Field name={`slides.${i}.href`} label="Chip link">
              <Input
                name={`slides.${i}.href`}
                value={s.href}
                onChange={(e) => patch(i, "href", e.target.value)}
                placeholder="/villas?sort=featured"
              />
            </Field>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-6 text-sm text-muted-foreground hover:bg-card hover:text-foreground"
      >
        <Plus className="h-4 w-4" /> Add another slide
      </button>

      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={onReset}
          disabled={resetPending}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          {resetPending ? "Resetting…" : "Reset to defaults"}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{slides.length} slide{slides.length !== 1 ? "s" : ""}</span>
          <Button type="submit" disabled={pending || slides.length === 0} className="rounded-full">
            {pending ? "Saving…" : "Save banners"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function IconBtn({
  children,
  className = "",
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Field({
  name,
  label,
  children,
}: {
  name: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name} className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function BannerImageField({
  src,
  alt,
  onUploaded,
  onRemove,
}: {
  src: string;
  alt: string;
  onUploaded: (url: string, name: string) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  function handleUpload(url: string, name: string) {
    setUploading(false);
    onUploaded(url, name);
  }

  if (src) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted">
        <div className="relative aspect-[21/9] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || "Banner image"}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-card px-3 py-2">
          <span className="truncate text-xs text-muted-foreground">
            {src.startsWith("/uploads/") ? src.split("/").pop() : src}
          </span>
          <div className="flex items-center gap-2">
            <ImageUploadButton
              label="Replace"
              onUploadStart={() => setUploading(true)}
              onUploaded={handleUpload}
            />
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
      {uploading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
      )}
      <p className="mt-2 text-sm font-medium text-foreground">
        {uploading ? "Uploading…" : "Upload a banner image"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        JPG, PNG, WebP, or AVIF · up to 25MB. Landscape (~16:9) looks best.
      </p>
      <div className="mt-4 inline-flex">
        <ImageUploadButton
          label="Choose image"
          onUploadStart={() => setUploading(true)}
          onUploaded={handleUpload}
        />
      </div>
    </div>
  );
}
