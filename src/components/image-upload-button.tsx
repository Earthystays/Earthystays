"use client";

import { useRef, useTransition } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ImageUploadButton({
  onUploaded,
  onUploadStart,
  label = "Upload image",
  className = "",
}: {
  onUploaded: (url: string, name: string) => void;
  onUploadStart?: () => void;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, start] = useTransition();

  function pick() {
    ref.current?.click();
  }

  function handleFile(file: File | null) {
    if (!file) return;
    onUploadStart?.();
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? "Upload failed");
        const first = json.files?.[0];
        if (!first?.url) throw new Error("No URL returned");
        onUploaded(first.url, first.name ?? file.name);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 ${className}`}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {busy ? "Uploading…" : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(e) => {
          handleFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </>
  );
}
