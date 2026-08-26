"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Trash2, Link2, Check, X } from "lucide-react";
import type { JournalMedia } from "@/lib/journal/types";
import { ImageUploadButton } from "@/components/image-upload-button";
import { recordUploadedMedia, updateMediaMeta, removeMedia } from "./actions";

const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-forest";

export function MediaLibrary({ initial }: { initial: JournalMedia[] }) {
  const [items, setItems] = useState<JournalMedia[]>(initial);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("");
  const [editing, setEditing] = useState<JournalMedia | null>(null);
  const [copied, setCopied] = useState<string>("");
  const [, start] = useTransition();

  const folders = useMemo(
    () => Array.from(new Set(items.map((m) => m.folder).filter(Boolean))) as string[],
    [items],
  );

  const filtered = items.filter((m) => {
    if (folder && m.folder !== folder) return false;
    if (!q) return true;
    const n = q.toLowerCase();
    return [m.fileName, m.alt, m.caption, m.credit, m.folder]
      .filter(Boolean)
      .some((s) => (s as string).toLowerCase().includes(n));
  });

  function onUploaded(url: string, name: string) {
    start(async () => {
      const res = await recordUploadedMedia({ url, fileName: name, kind: "image" });
      if (res.ok && res.media) {
        setItems((l) => [res.media!, ...l]);
        toast.success("Added to library");
      }
    });
  }

  function saveMeta(m: JournalMedia) {
    start(async () => {
      await updateMediaMeta(m.id, { alt: m.alt, caption: m.caption, credit: m.credit, folder: m.folder });
      setItems((l) => l.map((x) => (x.id === m.id ? m : x)));
      setEditing(null);
      toast.success("Saved");
    });
  }

  function del(id: string) {
    if (!confirm("Remove this asset from the library? (The file itself stays on disk.)")) return;
    start(async () => {
      await removeMedia(id);
      setItems((l) => l.filter((x) => x.id !== id));
      toast.success("Removed");
    });
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search media…" className={`${field} pl-9`} />
        </div>
        {folders.length > 0 && (
          <select value={folder} onChange={(e) => setFolder(e.target.value)} className={`${field} max-w-[180px]`}>
            <option value="">All folders</option>
            {folders.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
        <ImageUploadButton onUploaded={onUploaded} label="Upload media" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
          {items.length === 0 ? "No media yet. Upload your first asset." : "No media matches your search."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((m) => (
            <div key={m.id} className="group overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-[4/3] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt ?? ""} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => copy(m.url)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-foreground" aria-label="Copy URL">
                    {copied === m.url ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => del(m.id)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-destructive" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => setEditing(m)} className="block w-full p-3 text-left">
                <p className="truncate text-sm font-medium">{m.fileName}</p>
                <p className="truncate text-xs text-muted-foreground">{m.alt || "No alt text"}</p>
                {m.folder && <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{m.folder}</span>}
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Edit media</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={editing.url} alt="" className="mb-3 h-40 w-full rounded-lg object-cover" />
            <div className="space-y-2">
              <input value={editing.alt ?? ""} onChange={(e) => setEditing({ ...editing, alt: e.target.value })} className={field} placeholder="Alt text" />
              <input value={editing.caption ?? ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} className={field} placeholder="Caption" />
              <input value={editing.credit ?? ""} onChange={(e) => setEditing({ ...editing, credit: e.target.value })} className={field} placeholder="Credit" />
              <input value={editing.folder ?? ""} onChange={(e) => setEditing({ ...editing, folder: e.target.value })} className={field} placeholder="Folder (e.g. Goa)" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={() => saveMeta(editing)} className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
