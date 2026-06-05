"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { setLocationCover, clearLocationCover } from "./actions";

export function CoverUploader({
  storageKey,
  label,
  hint,
  initialUrl,
  fallbackUrl,
}: {
  storageKey: string;
  label: string;
  hint?: string;
  initialUrl?: string;
  fallbackUrl: string;
}) {
  const [url, setUrl] = useState<string | undefined>(initialUrl);
  const [uploading, startUpload] = useTransition();
  const [removing, startRemove] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function pick() {
    inputRef.current?.click();
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    startUpload(async () => {
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? "Upload failed");
        const u = json.files?.[0]?.url as string | undefined;
        if (!u) throw new Error("No URL returned");
        // Persist the cover mapping
        const saved = await setLocationCover(storageKey, u);
        if (!saved.ok) throw new Error(saved.error ?? "Could not save");
        setUrl(u);
        toast.success("Cover updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  function remove() {
    if (!url) return;
    startRemove(async () => {
      const res = await clearLocationCover(storageKey);
      if (!res.ok) {
        toast.error(res.error ?? "Could not reset");
        return;
      }
      setUrl(undefined);
      toast.success("Reverted to default cover");
    });
  }

  const displayUrl = url || fallbackUrl;
  const isOverride = Boolean(url);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold tracking-tight text-foreground">
            {label}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            isOverride
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isOverride ? "Custom" : "Default"}
        </span>
      </div>

      <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-md bg-muted">
        <Image
          src={displayUrl}
          alt={`${label} cover`}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading…" : isOverride ? "Replace cover" : "Upload cover"}
        </button>
        {isOverride && (
          <button
            type="button"
            onClick={remove}
            disabled={removing}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Reset to default
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
