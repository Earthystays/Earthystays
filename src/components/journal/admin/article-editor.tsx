"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Eye, Calendar, Loader2 } from "lucide-react";
import type {
  JournalArticle,
  JournalStatus,
  ContentBlock,
  JournalCategory,
  JournalAuthor,
  JournalDestination,
} from "@/lib/journal/types";
import { ImageUploadButton } from "@/components/image-upload-button";
import { BlockEditor, type BlockEditorOptions } from "./block-editor";
import { saveArticle, type SaveArticleInput } from "@/app/admin/(dashboard)/journal/actions";

const field =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-forest";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

const STATUS_LABEL: Record<JournalStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

export function ArticleEditor({
  article,
  categories,
  authors,
  destinations,
  blockOptions,
}: {
  article: JournalArticle;
  categories: JournalCategory[];
  authors: JournalAuthor[];
  destinations: JournalDestination[];
  blockOptions: BlockEditorOptions;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<"content" | "seo" | "settings">("content");

  const [form, setForm] = useState<JournalArticle>(article);
  const set = <K extends keyof JournalArticle>(k: K, v: JournalArticle[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const [tagsText, setTagsText] = useState(article.tags.join(", "));
  const [scheduleAt, setScheduleAt] = useState(
    article.scheduledFor ? article.scheduledFor.slice(0, 16) : "",
  );

  function persist(status: JournalStatus, opts: { scheduledFor?: string } = {}) {
    const payload: SaveArticleInput = {
      ...form,
      status,
      scheduledFor: opts.scheduledFor ?? form.scheduledFor,
      tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
    };
    start(async () => {
      const res = await saveArticle(payload);
      if (res.ok) {
        toast.success(`Saved · ${STATUS_LABEL[status]}`);
        if (!article.id && res.id) {
          router.replace(`/admin/journal/articles/${res.id}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.error ?? "Could not save");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main column */}
      <div className="min-w-0 space-y-5">
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Article title"
          className="w-full bg-transparent font-serif text-3xl text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        <input
          value={form.subtitle ?? ""}
          onChange={(e) => set("subtitle", e.target.value)}
          placeholder="Subtitle / standfirst (optional)"
          className="w-full bg-transparent text-lg text-muted-foreground outline-none"
        />

        <div className="flex gap-2 border-b border-border">
          {(["content", "seo", "settings"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm capitalize ${
                tab === t
                  ? "border-forest font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "content" && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Excerpt</label>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                className={field}
                placeholder="One or two sentences shown on cards and in search."
              />
            </div>
            <BlockEditor
              blocks={form.blocks}
              onChange={(blocks: ContentBlock[]) => set("blocks", blocks)}
              options={blockOptions}
            />
          </div>
        )}

        {tab === "seo" && (
          <div className="space-y-3">
            <Field label="SEO title" value={form.seo?.title} onChange={(v) => set("seo", { ...form.seo, title: v })} placeholder={form.title} />
            <div>
              <label className={labelCls}>Meta description</label>
              <textarea rows={2} value={form.seo?.description ?? ""} onChange={(e) => set("seo", { ...form.seo, description: e.target.value })} className={field} placeholder={form.excerpt} />
            </div>
            <Field label="Canonical URL" value={form.seo?.canonicalUrl} onChange={(v) => set("seo", { ...form.seo, canonicalUrl: v })} placeholder={`/journal/${form.slug || ""}`} />
            <Field label="OG title" value={form.seo?.ogTitle} onChange={(v) => set("seo", { ...form.seo, ogTitle: v })} />
            <Field label="OG description" value={form.seo?.ogDescription} onChange={(v) => set("seo", { ...form.seo, ogDescription: v })} />
            <div>
              <label className={labelCls}>OG / social image</label>
              {form.seo?.ogImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.seo.ogImage} alt="" className="mb-2 h-28 w-full rounded-md object-cover" />
              )}
              <ImageUploadButton onUploaded={(url) => set("seo", { ...form.seo, ogImage: url })} label="Upload OG image" />
            </div>
            <Field label="Focus keyword" value={form.seo?.focusKeyword} onChange={(v) => set("seo", { ...form.seo, focusKeyword: v })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.seo?.noindex} onChange={(e) => set("seo", { ...form.seo, noindex: e.target.checked })} />
              Hide from search engines (noindex)
            </label>
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-3">
            <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} placeholder="auto-generated from title" />
            <div>
              <label className={labelCls}>Tags (comma separated)</label>
              <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={field} placeholder="goa, food, cafes" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Reading time (min)</label>
                <input type="number" min={1} value={form.readingTime ?? ""} onChange={(e) => set("readingTime", e.target.value ? Number(e.target.value) : undefined)} className={field} placeholder="auto" />
              </div>
              <div>
                <label className={labelCls}>Editor&apos;s Pick rank</label>
                <input type="number" min={1} value={form.editorsPickRank ?? ""} onChange={(e) => set("editorsPickRank", e.target.value ? Number(e.target.value) : undefined)} className={field} placeholder="none" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Featured article
            </label>
            {form.previousSlugs && form.previousSlugs.length > 0 && (
              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Previous URLs (auto-redirect)</p>
                {form.previousSlugs.map((s) => (
                  <p key={s}>/journal/{s}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Status</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {STATUS_LABEL[form.status]}
            </span>
          </div>
          <div className="grid gap-2">
            <button type="button" disabled={pending} onClick={() => persist("draft")} className="inline-flex items-center justify-center gap-2 rounded-md border border-border py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save draft
            </button>
            <button type="button" disabled={pending} onClick={() => persist("published")} className="inline-flex items-center justify-center gap-2 rounded-md bg-forest py-2 text-sm font-medium text-white hover:bg-forest-deep disabled:opacity-50">
              <Eye className="h-4 w-4" /> Publish
            </button>
            {form.slug && (
              <a href={`/journal/${form.slug}`} target="_blank" rel="noreferrer" className="text-center text-xs text-forest hover:underline">
                Preview live page ↗
              </a>
            )}
          </div>
          <div className="mt-3 border-t border-border/60 pt-3">
            <label className={labelCls}>Schedule publish</label>
            <div className="flex gap-2">
              <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={`${field} text-xs`} />
              <button type="button" disabled={pending || !scheduleAt} onClick={() => persist("scheduled", { scheduledFor: new Date(scheduleAt).toISOString() })} className="shrink-0 rounded-md border border-border px-3 text-xs hover:bg-muted disabled:opacity-40" aria-label="Schedule">
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div>
            <label className={labelCls}>Category</label>
            <select value={form.categorySlug} onChange={(e) => set("categorySlug", e.target.value)} className={field}>
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Author</label>
            <select value={form.authorId ?? ""} onChange={(e) => set("authorId", e.target.value || undefined)} className={field}>
              <option value="">Unattributed</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Destination</label>
            <select value={form.destinationSlug ?? ""} onChange={(e) => set("destinationSlug", e.target.value || undefined)} className={field}>
              <option value="">None</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <label className={labelCls}>Hero image</label>
          {form.heroImage?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.heroImage.src} alt="" className="h-32 w-full rounded-md object-cover" />
          )}
          <ImageUploadButton onUploaded={(url, name) => set("heroImage", { src: url, alt: form.heroImage?.alt || name })} label={form.heroImage?.src ? "Replace" : "Upload hero"} />
          <input value={form.heroImage?.alt ?? ""} onChange={(e) => set("heroImage", { src: form.heroImage?.src ?? "", alt: e.target.value })} className={field} placeholder="Hero alt text" />
          <label className={labelCls}>Mobile hero (optional)</label>
          {form.mobileHeroImage?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.mobileHeroImage.src} alt="" className="h-24 w-full rounded-md object-cover" />
          )}
          <ImageUploadButton onUploaded={(url, name) => set("mobileHeroImage", { src: url, alt: name })} label="Upload mobile hero" />
          <input value={form.heroCaption ?? ""} onChange={(e) => set("heroCaption", e.target.value)} className={field} placeholder="Hero caption" />
          <input value={form.heroCredit ?? ""} onChange={(e) => set("heroCredit", e.target.value)} className={field} placeholder="Hero credit" />
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={field} placeholder={placeholder} />
    </div>
  );
}
