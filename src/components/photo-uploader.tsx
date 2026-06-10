"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Star,
  Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export type UploadedPhoto = { src: string; alt: string; tag?: string };

/**
 * Common per-photo room/area tags. Used to populate a <datalist> so the admin
 * can pick a preset OR type a custom value.
 */
export const PHOTO_TAGS = [
  "Living Area",
  "Kitchen",
  "Dining Area",
  "Master Bedroom",
  "Bedroom 1",
  "Bedroom 2",
  "Bedroom 3",
  "Bedroom 4",
  "Bedroom 5",
  "Bathroom 1",
  "Bathroom 2",
  "Master Bathroom",
  "Balcony",
  "Terrace",
  "Patio",
  "Pool",
  "Garden",
  "Lawn",
  "Exterior",
  "Entrance",
  "Hallway",
  "Game Room",
  "Bar",
  "Office",
  "View",
  "Other",
];

const DATALIST_ID = "photo-tags";

export function PhotoUploader({
  name,
  initial = [],
}: {
  name: string; // hidden input name (JSON serialized)
  initial?: UploadedPhoto[];
}) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(initial);
  const [uploading, startUploading] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    for (const file of Array.from(files)) fd.append("file", file);

    startUploading(async () => {
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Upload failed");
        }
        const newPhotos: UploadedPhoto[] = json.files.map(
          (f: { url: string; name: string }) => ({
            src: f.url,
            alt: f.name.replace(/\.[a-z]+$/i, "").replace(/[-_]+/g, " "),
          }),
        );
        setPhotos((prev) => [...prev, ...newPhotos]);
        toast.success(`Uploaded ${newPhotos.length} photo${newPhotos.length === 1 ? "" : "s"}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  function patch<K extends keyof UploadedPhoto>(i: number, key: K, value: UploadedPhoto[K]) {
    setPhotos((p) => p.map((ph, idx) => (idx === i ? { ...ph, [key]: value } : ph)));
  }
  function remove(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    if (editing === i) setEditing(null);
  }
  function move(i: number, dir: -1 | 1) {
    setPhotos((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const copy = [...p];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  /** Move photo at index i to position 0 — becomes the cover photo. */
  function makePrimary(i: number) {
    if (i === 0) return;
    setPhotos((p) => {
      const copy = [...p];
      const [picked] = copy.splice(i, 1);
      copy.unshift(picked);
      return copy;
    });
  }
  const [editing, setEditing] = useState<number | null>(null);

  return (
    <div className="grid gap-4">
      <input type="hidden" name={name} value={JSON.stringify(photos)} />

      {/* Shared datalist of preset tags */}
      <datalist id={DATALIST_ID}>
        {PHOTO_TAGS.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        )}
        <p className="text-sm font-medium text-foreground">
          {uploading ? "Uploading…" : "Click to upload or drag photos here"}
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP, or AVIF · up to 25MB each · multiple files supported
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {photos.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {photos.length} photo{photos.length === 1 ? "" : "s"} — the first
            one (star ★) is used as the cover. Click any other photo&apos;s
            star to make it the cover.
          </p>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p, i) => {
              const isPrimary = i === 0;
              return (
                <li
                  key={p.src + i}
                  className={`group relative overflow-hidden rounded-lg border bg-card ${
                    isPrimary
                      ? "border-terracotta ring-2 ring-terracotta/30"
                      : "border-border/60"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />

                    {/* Primary badge (top-left) — green star on cover */}
                    {isPrimary ? (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                        <Star className="h-3 w-3 fill-white" /> COVER
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makePrimary(i)}
                        aria-label="Make this the cover photo"
                        title="Make this the cover photo"
                        className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Delete + edit (top-right) */}
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(editing === i ? null : i)}
                        aria-label="Edit alt text + tag"
                        title="Edit alt text + tag"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        aria-label="Remove photo"
                        title="Remove photo"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-destructive opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Tag chip (bottom-left) */}
                    {p.tag && (
                      <span className="absolute bottom-2 left-2 inline-flex items-center rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                        {p.tag}
                      </span>
                    )}

                    {/* Reorder (bottom-right) */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label="Move left"
                        title="Move left"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100 disabled:opacity-0"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === photos.length - 1}
                        aria-label="Move right"
                        title="Move right"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100 disabled:opacity-0"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Edit panel — only shown when admin clicks the pencil */}
                  {editing === i && (
                    <div className="grid gap-2 border-t border-border/60 bg-muted/30 p-3">
                      <label className="grid gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Alt text
                        </span>
                        <Input
                          value={p.alt}
                          onChange={(e) => patch(i, "alt", e.target.value)}
                          placeholder="What's in this photo?"
                          className="h-8 text-xs"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Tag (room or area)
                        </span>
                        <Input
                          value={p.tag ?? ""}
                          onChange={(e) => patch(i, "tag", e.target.value)}
                          list={DATALIST_ID}
                          placeholder="Bedroom 1, Kitchen…"
                          className="h-8 text-xs"
                        />
                      </label>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
