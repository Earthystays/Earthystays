"use client";

import { useRef, useState } from "react";
import { FileText, Upload, Loader2, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export type BrochureValue = {
  url: string;
  fileName: string;
  uploadedAt: string;
} | null;

const MAX_BYTES = 10 * 1024 * 1024;

export function BrochureUploader({
  name,
  initial = null,
  endpoint = "/api/admin/upload",
}: {
  name: string;
  initial?: BrochureValue;
  endpoint?: string;
}) {
  const [value, setValue] = useState<BrochureValue>(initial);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Brochure must be smaller than 10 MB.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; files: { url: string; name: string }[] }
        | { ok: false; error?: string }
        | null;
      if (!res.ok || !data || !("ok" in data) || !data.ok) {
        const msg =
          data && "error" in data && data.error
            ? data.error
            : "Unable to upload brochure. Please try again.";
        toast.error(msg);
        return;
      }
      const f = data.files[0];
      if (!f) {
        toast.error("Unable to upload brochure. Please try again.");
        return;
      }
      setValue({
        url: f.url,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      });
      toast.success("Brochure uploaded");
    } catch {
      toast.error("Unable to upload brochure. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDelete() {
    setValue(null);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value ? JSON.stringify(value) : ""} />
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={busy}
      />

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Property Brochure</p>
              <p className="truncate text-xs text-muted-foreground">{value.fileName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={value.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View
            </a>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Replace
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/50 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Upload Brochure
            </>
          )}
        </button>
      )}
    </div>
  );
}
