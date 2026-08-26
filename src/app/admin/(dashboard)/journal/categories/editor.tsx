"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Trash2, Plus, Save } from "lucide-react";
import type { JournalCategory } from "@/lib/journal/types";
import { ImageUploadButton } from "@/components/image-upload-button";
import { saveCategoryList } from "../taxonomy-actions";

const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-forest";

export function CategoriesEditor({ initial }: { initial: JournalCategory[] }) {
  const [list, setList] = useState<JournalCategory[]>(initial);
  const [newName, setNewName] = useState("");
  const [pending, start] = useTransition();

  const patch = (slug: string, p: Partial<JournalCategory>) =>
    setList((l) => l.map((c) => (c.slug === slug ? { ...c, ...p } : c)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  };

  function save() {
    start(async () => {
      try {
        const res = await saveCategoryList(list);
        if (res.ok) toast.success("Categories saved");
        else toast.error(res.error ?? "Could not save");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  function add() {
    if (newName.trim().length < 2) return;
    const slug = newName.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (list.some((c) => c.slug === slug)) {
      toast.error("That category already exists.");
      return;
    }
    setList([...list, { slug, name: newName.trim(), order: list.length, enabled: true }]);
    setNewName("");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {list.map((c, i) => (
          <div key={c.slug} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col pt-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
              </div>
              {c.image?.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image.src} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input value={c.name} onChange={(e) => patch(c.slug, { name: e.target.value })} className={field} />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={c.enabled} onChange={(e) => patch(c.slug, { enabled: e.target.checked })} />
                    Enabled
                  </label>
                  <button type="button" onClick={() => setList(list.filter((x) => x.slug !== c.slug))} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <input value={c.description ?? ""} onChange={(e) => patch(c.slug, { description: e.target.value })} className={field} placeholder="Description (optional)" />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">/journal/category/{c.slug}</span>
                  <ImageUploadButton onUploaded={(url, name) => patch(c.slug, { image: { src: url, alt: name } })} label={c.image?.src ? "Replace image" : "Add image"} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className={field} placeholder="New category name" />
        <button type="button" onClick={add} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add</button>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button type="button" onClick={save} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-forest-deep disabled:opacity-50">
          <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
