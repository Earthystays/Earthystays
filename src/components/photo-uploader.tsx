"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, X, ArrowUp, ArrowDown, Loader2, Tag as TagIcon } from "lucide-react";
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
        <ul className="grid gap-3">
          {photos.map((p, i) => (
            <li
              key={p.src + i}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3"
            >
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
                {p.tag && (
                  <span className="absolute bottom-1 left-1 inline-flex items-center rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
                    {p.tag}
                  </span>
                )}
              </div>
              <div className="flex-1 grid gap-2">
                <div className="grid gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Alt text · photo {i + 1}
                  </label>
                  <Input
                    value={p.alt}
                    onChange={(e) => patch(i, "alt", e.target.value)}
                    placeholder="What's in this photo?"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                    <TagIcon className="h-3 w-3" /> Tag (room or area)
                  </label>
                  <Input
                    value={p.tag ?? ""}
                    onChange={(e) => patch(i, "tag", e.target.value)}
                    list={DATALIST_ID}
                    placeholder="e.g. Bedroom 1, Kitchen, Living Area"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === photos.length - 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
