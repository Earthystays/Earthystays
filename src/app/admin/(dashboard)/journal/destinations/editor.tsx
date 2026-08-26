"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Trash2, Plus, Save } from "lucide-react";
import type { JournalDestination } from "@/lib/journal/types";
import { ImageUploadButton } from "@/components/image-upload-button";
import { MultiEntityPicker, type EntityOption } from "@/components/journal/admin/entity-picker";
import { saveDestinationList } from "../taxonomy-actions";

const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-forest";

export function DestinationsEditor({
  initial,
  properties,
  experiences,
}: {
  initial: JournalDestination[];
  properties: EntityOption[];
  experiences: EntityOption[];
}) {
  const [list, setList] = useState<JournalDestination[]>(initial);
  const [newName, setNewName] = useState("");
  const [pending, start] = useTransition();

  const patch = (slug: string, p: Partial<JournalDestination>) =>
    setList((l) => l.map((d) => (d.slug === slug ? { ...d, ...p } : d)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  };

  function save() {
    start(async () => {
      const res = await saveDestinationList(list);
      if (res.ok) toast.success("Destinations saved");
      else toast.error("Could not save");
    });
  }

  function add() {
    if (newName.trim().length < 2) return;
    const slug = newName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (list.some((d) => d.slug === slug)) return toast.error("Already exists.");
    setList([...list, { slug, name: newName.trim(), order: list.length, enabled: true }]);
    setNewName("");
  }

  return (
    <div className="space-y-4">
      {list.map((d, i) => (
        <div key={d.slug} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col pt-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
            </div>
            {d.image?.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.image.src} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <input value={d.name} onChange={(e) => patch(d.slug, { name: e.target.value })} className={field} placeholder="Name" />
                <input value={d.location ?? ""} onChange={(e) => patch(d.slug, { location: e.target.value })} className={`${field} max-w-[180px]`} placeholder="Location" />
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={d.enabled} onChange={(e) => patch(d.slug, { enabled: e.target.checked })} /> Enabled
                </label>
                <button type="button" onClick={() => setList(list.filter((x) => x.slug !== d.slug))} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea rows={2} value={d.description ?? ""} onChange={(e) => patch(d.slug, { description: e.target.value })} className={field} placeholder="Description" />
              <ImageUploadButton onUploaded={(url, name) => patch(d.slug, { image: { src: url, alt: name } })} label={d.image?.src ? "Replace image" : "Add hero image"} />
              <div className="grid gap-3 pt-1 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Related stays</p>
                  <MultiEntityPicker options={properties} values={d.relatedPropertySlugs ?? []} onChange={(slugs) => patch(d.slug, { relatedPropertySlugs: slugs })} placeholder="Add property…" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Related experiences</p>
                  <MultiEntityPicker options={experiences} values={d.relatedExperienceSlugs ?? []} onChange={(slugs) => patch(d.slug, { relatedExperienceSlugs: slugs })} placeholder="Add experience…" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className={field} placeholder="New destination name (e.g. Morjim)" />
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
