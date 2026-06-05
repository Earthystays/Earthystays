"use client";

import { useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { parseVideoUrl } from "@/lib/video";

export function VideoInput({
  name,
  initial = "",
}: {
  name: string; // single text field — URL or upload path
  initial?: string;
}) {
  const [value, setValue] = useState<string>(initial);
  const [uploading, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please pick a video file (MP4, WebM, or MOV).");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok || !j.ok) throw new Error(j.error ?? "Upload failed");
        setValue(j.files[0].url);
        toast.success("Video uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  const parsed = parseVideoUrl(value);
  const isYoutube = parsed?.kind === "youtube";
  const isVimeo = parsed?.kind === "vimeo";
  const isFile = parsed?.kind === "file";

  return (
    <div className="grid gap-3">
      <input type="hidden" name={name} value={value} />

      <div className="grid gap-2">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Video URL (YouTube or Vimeo)
        </label>
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            className="flex-1"
          />
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue("")}
              className="shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full justify-center rounded-md"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> Upload an MP4 / WebM / MOV (max 100MB)
          </>
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="sr-only"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {parsed && (
        <div className="rounded-lg border border-border/60 bg-card p-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <VideoIcon className="h-3.5 w-3.5 text-terracotta" />
            {isYoutube && <span>YouTube · ID {parsed.id}</span>}
            {isVimeo && <span>Vimeo · ID {parsed.id}</span>}
            {isFile && <span className="truncate">{parsed.src}</span>}
          </div>
          {isFile && parsed.src && (
            <video src={parsed.src} controls className="mt-2 max-h-40 w-full rounded" />
          )}
        </div>
      )}
      {value && !parsed && (
        <p className="text-xs text-destructive">
          Couldn&apos;t recognize that link. Use a YouTube/Vimeo URL or upload a file.
        </p>
      )}
    </div>
  );
}
