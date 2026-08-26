"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, Trash2, Plus, Save } from "lucide-react";
import type { JournalCampaign } from "@/lib/journal/types";
import { ImageUploadButton } from "@/components/image-upload-button";
import { MultiEntityPicker, type EntityOption } from "@/components/journal/admin/entity-picker";
import { saveCampaign, deleteCampaign, toggleCampaign } from "./actions";

const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-forest";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

type Draft = Omit<JournalCampaign, "id" | "createdAt" | "updatedAt"> & { id?: string };

function blank(): Draft {
  return { id: undefined, name: "", slug: "", enabled: false, headline: "", articleSlugs: [], propertySlugs: [], experienceSlugs: [] };
}

export function CampaignsEditor({
  initial,
  articles,
  properties,
  experiences,
}: {
  initial: JournalCampaign[];
  articles: EntityOption[];
  properties: EntityOption[];
  experiences: EntityOption[];
}) {
  const [list, setList] = useState<Draft[]>(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [, start] = useTransition();

  const patch = (idx: number, p: Partial<Draft>) =>
    setList((l) => l.map((c, i) => (i === idx ? { ...c, ...p } : c)));

  function addNew() {
    const d = blank();
    setList([d, ...list]);
    setOpenId("new");
  }

  function save(idx: number) {
    const c = list[idx];
    start(async () => {
      const res = await saveCampaign(c);
      if (res.ok) {
        if (res.id) patch(idx, { id: res.id });
        toast.success("Campaign saved");
      } else toast.error(res.error ?? "Could not save");
    });
  }

  function del(idx: number) {
    const c = list[idx];
    if (c.id && !confirm("Delete this campaign?")) return;
    if (c.id) start(async () => { await deleteCampaign(c.id!); toast.success("Deleted"); });
    setList(list.filter((_, i) => i !== idx));
  }

  function toggle(idx: number, enabled: boolean) {
    patch(idx, { enabled });
    const c = list[idx];
    if (c.id) start(async () => { await toggleCampaign(c.id!, enabled); });
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={addNew} className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-deep">
        <Plus className="h-4 w-4" /> New campaign
      </button>

      {list.map((c, idx) => {
        const key = c.id ?? "new";
        const isOpen = openId === key;
        return (
          <div key={key} className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 p-4">
              <button type="button" onClick={() => setOpenId(isOpen ? null : key)} className="flex flex-1 items-center gap-3 text-left">
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                <div>
                  <p className="font-medium">{c.name || "Untitled campaign"}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.startsAt ? new Date(c.startsAt).toLocaleDateString("en-IN") : "no start"} → {c.endsAt ? new Date(c.endsAt).toLocaleDateString("en-IN") : "no end"}
                  </p>
                </div>
              </button>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" checked={c.enabled} onChange={(e) => toggle(idx, e.target.checked)} /> Live
              </label>
              <button type="button" onClick={() => del(idx)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>

            {isOpen && (
              <div className="space-y-3 border-t border-border/60 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Name</label><input value={c.name} onChange={(e) => patch(idx, { name: e.target.value })} className={field} placeholder="Monsoon in Goa" /></div>
                  <div><label className={labelCls}>Slug</label><input value={c.slug} onChange={(e) => patch(idx, { slug: e.target.value })} className={field} placeholder="auto" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Starts</label><input type="datetime-local" value={c.startsAt ? c.startsAt.slice(0, 16) : ""} onChange={(e) => patch(idx, { startsAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className={field} /></div>
                  <div><label className={labelCls}>Ends</label><input type="datetime-local" value={c.endsAt ? c.endsAt.slice(0, 16) : ""} onChange={(e) => patch(idx, { endsAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className={field} /></div>
                </div>
                <div><label className={labelCls}>Headline</label><input value={c.headline} onChange={(e) => patch(idx, { headline: e.target.value })} className={field} placeholder="Monsoon in Goa — greener, quieter, cheaper" /></div>
                <div><label className={labelCls}>Description</label><textarea rows={2} value={c.description ?? ""} onChange={(e) => patch(idx, { description: e.target.value })} className={field} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>CTA label</label><input value={c.ctaLabel ?? ""} onChange={(e) => patch(idx, { ctaLabel: e.target.value })} className={field} placeholder="Explore monsoon stays" /></div>
                  <div><label className={labelCls}>CTA link</label><input value={c.ctaHref ?? ""} onChange={(e) => patch(idx, { ctaHref: e.target.value })} className={field} placeholder="/villas" /></div>
                </div>
                <div>
                  <label className={labelCls}>Banner image</label>
                  {c.image?.src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image.src} alt="" className="mb-2 h-28 w-full rounded-md object-cover" />
                  )}
                  <ImageUploadButton onUploaded={(url, name) => patch(idx, { image: { src: url, alt: c.image?.alt || name } })} label="Upload banner" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Featured articles</label>
                    <MultiEntityPicker options={articles} values={c.articleSlugs ?? []} onChange={(slugs) => patch(idx, { articleSlugs: slugs })} placeholder="Add article…" />
                  </div>
                  <div>
                    <label className={labelCls}>Featured stays</label>
                    <MultiEntityPicker options={properties} values={c.propertySlugs ?? []} onChange={(slugs) => patch(idx, { propertySlugs: slugs })} placeholder="Add property…" />
                  </div>
                  <div>
                    <label className={labelCls}>Featured experiences</label>
                    <MultiEntityPicker options={experiences} values={c.experienceSlugs ?? []} onChange={(slugs) => patch(idx, { experienceSlugs: slugs })} placeholder="Add experience…" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => save(idx)} className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white hover:bg-forest-deep">
                    <Save className="h-4 w-4" /> Save campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {list.length === 0 && (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No campaigns yet. Create a seasonal campaign to feature a banner on the Journal homepage during a date window.
        </p>
      )}
    </div>
  );
}
