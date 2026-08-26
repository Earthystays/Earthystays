"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Save } from "lucide-react";
import type { JournalHomepage, HomepageSectionKey } from "@/lib/journal/types";
import { ImageUploadButton } from "@/components/image-upload-button";
import {
  MultiEntityPicker,
  type EntityOption,
} from "@/components/journal/admin/entity-picker";
import { saveHomepageConfig } from "./actions";

const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-forest";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

const SECTION_LABEL: Record<HomepageSectionKey, string> = {
  hero: "Hero",
  categories: "Category nav",
  editorsPicks: "Editor's Picks",
  destinations: "Destinations",
  latest: "Latest Stories",
  stays: "Stays band",
  experiences: "Experiences band",
  instagram: "Instagram",
  newsletter: "Newsletter",
};

export function HomepageEditor({
  initial,
  properties,
  experiences,
  destinations,
}: {
  initial: JournalHomepage;
  properties: EntityOption[];
  experiences: EntityOption[];
  destinations: EntityOption[];
}) {
  const [cfg, setCfg] = useState<JournalHomepage>(initial);
  const [pending, start] = useTransition();

  const set = <K extends keyof JournalHomepage>(k: K, v: JournalHomepage[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));
  const setHero = (p: Partial<JournalHomepage["hero"]>) => set("hero", { ...cfg.hero, ...p });

  const moveSection = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cfg.order.length) return;
    const order = cfg.order.slice();
    [order[i], order[j]] = [order[j], order[i]];
    set("order", order);
  };

  const enabledOf = (key: HomepageSectionKey): boolean => {
    if (key === "categories") return cfg.categoriesEnabled;
    const s = cfg[key as Exclude<HomepageSectionKey, "categories">] as { enabled?: boolean };
    return !!s?.enabled;
  };
  const toggle = (key: HomepageSectionKey, val: boolean) => {
    if (key === "categories") return set("categoriesEnabled", val);
    const k = key as Exclude<HomepageSectionKey, "categories">;
    set(k, { ...(cfg[k] as object), enabled: val } as JournalHomepage[typeof k]);
  };

  function save() {
    start(async () => {
      const res = await saveHomepageConfig(cfg);
      if (res.ok) toast.success("Homepage saved");
      else toast.error("Could not save");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        {/* Hero */}
        <Card title="Hero">
          <div className="grid gap-3">
            <div>
              <label className={labelCls}>Title (line breaks allowed)</label>
              <textarea rows={3} value={cfg.hero.title} onChange={(e) => setHero({ title: e.target.value })} className={field} />
            </div>
            <div>
              <label className={labelCls}>Subtitle</label>
              <textarea rows={2} value={cfg.hero.subtitle} onChange={(e) => setHero({ subtitle: e.target.value })} className={field} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>CTA label</label><input value={cfg.hero.ctaLabel} onChange={(e) => setHero({ ctaLabel: e.target.value })} className={field} /></div>
              <div><label className={labelCls}>CTA link</label><input value={cfg.hero.ctaHref} onChange={(e) => setHero({ ctaHref: e.target.value })} className={field} /></div>
            </div>
            <div>
              <label className={labelCls}>Hero image</label>
              {cfg.hero.image?.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.hero.image.src} alt="" className="mb-2 h-32 w-full rounded-md object-cover" />
              )}
              <ImageUploadButton onUploaded={(url, name) => setHero({ image: { src: url, alt: cfg.hero.image?.alt || name } })} label="Upload hero image" />
            </div>
          </div>
        </Card>

        {/* Editor's Picks */}
        <Card title="Editor's Picks">
          <Row><label className={labelCls}>Section title</label><input value={cfg.editorsPicks.title} onChange={(e) => set("editorsPicks", { ...cfg.editorsPicks, title: e.target.value })} className={field} /></Row>
          <Row><label className={labelCls}>Max articles</label><input type="number" min={1} max={8} value={cfg.editorsPicks.max} onChange={(e) => set("editorsPicks", { ...cfg.editorsPicks, max: Number(e.target.value) })} className={`${field} w-24`} /></Row>
          <p className="text-xs text-muted-foreground">Articles are chosen by setting an “Editor&apos;s Pick rank” on each article.</p>
        </Card>

        {/* Destinations */}
        <Card title="Destinations">
          <Row><label className={labelCls}>Section title</label><input value={cfg.destinations.title} onChange={(e) => set("destinations", { ...cfg.destinations, title: e.target.value })} className={field} /></Row>
          <Row><label className={labelCls}>Description</label><input value={cfg.destinations.description ?? ""} onChange={(e) => set("destinations", { ...cfg.destinations, description: e.target.value })} className={field} /></Row>
          <label className={labelCls}>Featured destinations (empty = show all enabled)</label>
          <MultiEntityPicker options={destinations} values={cfg.destinations.slugs} onChange={(slugs) => set("destinations", { ...cfg.destinations, slugs })} placeholder="Add destination…" />
        </Card>

        {/* Latest */}
        <Card title="Latest Stories">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Title</label><input value={cfg.latest.title} onChange={(e) => set("latest", { ...cfg.latest, title: e.target.value })} className={field} /></div>
            <div><label className={labelCls}>How many</label><input type="number" min={1} max={12} value={cfg.latest.count} onChange={(e) => set("latest", { ...cfg.latest, count: Number(e.target.value) })} className={field} /></div>
          </div>
        </Card>

        {/* Stays */}
        <Card title="Stays band">
          <Row><label className={labelCls}>Headline</label><input value={cfg.stays.title} onChange={(e) => set("stays", { ...cfg.stays, title: e.target.value })} className={field} /></Row>
          <Row><label className={labelCls}>CTA link</label><input value={cfg.stays.ctaHref} onChange={(e) => set("stays", { ...cfg.stays, ctaHref: e.target.value })} className={field} /></Row>
          <label className={labelCls}>Featured stay (empty = auto)</label>
          <MultiEntityPicker options={properties} values={cfg.stays.slugs} onChange={(slugs) => set("stays", { ...cfg.stays, slugs })} placeholder="Add property…" />
        </Card>

        {/* Experiences */}
        <Card title="Experiences band">
          <Row><label className={labelCls}>Headline</label><input value={cfg.experiences.title} onChange={(e) => set("experiences", { ...cfg.experiences, title: e.target.value })} className={field} /></Row>
          <Row><label className={labelCls}>CTA link</label><input value={cfg.experiences.ctaHref} onChange={(e) => set("experiences", { ...cfg.experiences, ctaHref: e.target.value })} className={field} /></Row>
          <label className={labelCls}>Featured experience (empty = auto)</label>
          <MultiEntityPicker options={experiences} values={cfg.experiences.slugs} onChange={(slugs) => set("experiences", { ...cfg.experiences, slugs })} placeholder="Add experience…" />
        </Card>

        {/* Instagram */}
        <Card title="Instagram">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Handle</label><input value={cfg.instagram.handle} onChange={(e) => set("instagram", { ...cfg.instagram, handle: e.target.value })} className={field} /></div>
            <div><label className={labelCls}>Profile URL</label><input value={cfg.instagram.url} onChange={(e) => set("instagram", { ...cfg.instagram, url: e.target.value })} className={field} /></div>
          </div>
          <label className={labelCls}>Images (manually uploaded fallback)</label>
          <div className="mb-2 grid grid-cols-6 gap-2">
            {cfg.instagram.images.map((img, idx) => (
              <div key={idx} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" className="aspect-square w-full rounded-md object-cover" />
                <button type="button" onClick={() => set("instagram", { ...cfg.instagram, images: cfg.instagram.images.filter((_, k) => k !== idx) })} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-destructive text-xs text-white">×</button>
              </div>
            ))}
          </div>
          <ImageUploadButton onUploaded={(url, name) => set("instagram", { ...cfg.instagram, images: [...cfg.instagram.images, { src: url, alt: name }] })} label="Add photo" />
        </Card>

        {/* Newsletter */}
        <Card title="Newsletter">
          <Row><label className={labelCls}>Title</label><input value={cfg.newsletter.title} onChange={(e) => set("newsletter", { ...cfg.newsletter, title: e.target.value })} className={field} /></Row>
          <Row><label className={labelCls}>Description</label><textarea rows={2} value={cfg.newsletter.description ?? ""} onChange={(e) => set("newsletter", { ...cfg.newsletter, description: e.target.value })} className={field} /></Row>
        </Card>
      </div>

      {/* Sidebar: section order + visibility */}
      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">Sections</p>
          <p className="mb-3 text-xs text-muted-foreground">Reorder and toggle each homepage section.</p>
          <ul className="space-y-1.5">
            {cfg.order.map((key, i) => (
              <li key={key} className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5">
                <div className="flex flex-col">
                  <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => moveSection(i, 1)} disabled={i === cfg.order.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                </div>
                <span className="flex-1 text-sm">{SECTION_LABEL[key]}</span>
                <input type="checkbox" checked={enabledOf(key)} onChange={(e) => toggle(key, e.target.checked)} aria-label={`Toggle ${SECTION_LABEL[key]}`} />
              </li>
            ))}
          </ul>
        </div>
        <div className="sticky top-4">
          <button type="button" onClick={save} disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-forest-deep disabled:opacity-50">
            <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save homepage"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 font-medium text-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
