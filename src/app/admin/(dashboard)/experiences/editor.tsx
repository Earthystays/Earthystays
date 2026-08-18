"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  ArrowUp,
  ArrowDown,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadButton } from "@/components/image-upload-button";
import type {
  CarryItem,
  Experience,
  ExperienceCategory,
  ExperienceHost,
  ExperiencePhoto,
  ExperienceStatus,
  ItineraryStop,
} from "@/lib/types";
import {
  saveExperience,
  deleteExperience,
  duplicateExperience,
  setExperienceStatus,
} from "./actions";

const CURRENCY = "INR";

function experienceUrl(e: Pick<Experience, "slug" | "citySlug">) {
  return `/experiences/${e.citySlug || "goa"}/${e.slug}`;
}

export function ExperiencesAdmin({
  experiences,
  categories,
  hosts,
  views,
}: {
  experiences: Experience[];
  categories: ExperienceCategory[];
  hosts: ExperienceHost[];
  views: Record<string, number>;
}) {
  const [editing, setEditing] = useState<Experience | null>(null);
  const [adding, setAdding] = useState(false);

  if (adding || editing) {
    return (
      <ExperienceForm
        key={editing?.slug ?? "new"}
        initial={editing ?? undefined}
        categories={categories}
        hosts={hosts}
        allSlugs={experiences.map((e) => e.slug)}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {experiences.length}{" "}
          {experiences.length === 1 ? "experience" : "experiences"}
        </p>
        <Button onClick={() => setAdding(true)} className="rounded-full">
          <Plus className="mr-1.5 h-4 w-4" />
          New experience
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {experiences.map((e) => (
              <Row
                key={e.slug}
                e={e}
                categoryName={categories.find((c) => c.slug === e.category)?.name}
                views={views[e.slug] ?? 0}
                onEdit={() => setEditing(e)}
              />
            ))}
            {experiences.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No experiences yet. Create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  e,
  categoryName,
  views,
  onEdit,
}: {
  e: Experience;
  categoryName?: string;
  views: number;
  onEdit: () => void;
}) {
  const [pending, start] = useTransition();
  const status = e.status ?? "published";

  function toggleStatus() {
    const next: ExperienceStatus = status === "published" ? "draft" : "published";
    start(async () => {
      const res = await setExperienceStatus(e.slug, next);
      if (res.ok) toast.success(next === "published" ? "Published" : "Moved to draft");
      else toast.error(res.error ?? "Failed");
    });
  }
  function dup() {
    start(async () => {
      const res = await duplicateExperience(e.slug);
      if (res.ok) toast.success("Duplicated");
      else toast.error(res.error ?? "Failed");
    });
  }
  function del() {
    if (!confirm(`Delete "${e.name}"? This cannot be undone.`)) return;
    start(async () => {
      const res = await deleteExperience(e.slug);
      if (res.ok) toast.success("Deleted");
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <tr className={pending ? "opacity-50" : ""}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={e.image.src}
            alt=""
            className="h-10 w-14 shrink-0 rounded-md object-cover"
          />
          <span className="font-medium text-foreground">{e.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">{categoryName ?? "—"}</td>
      <td className="px-4 py-3 text-muted-foreground">{e.city ?? "—"}</td>
      <td className="px-4 py-3 tabular-nums text-muted-foreground">
        {typeof e.priceFrom === "number" ? `₹${e.priceFrom.toLocaleString("en-IN")}` : "—"}
      </td>
      <td className="px-4 py-3 tabular-nums text-muted-foreground">{views}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <IconBtn title="Preview" href={experienceUrl(e)}>
            <ExternalLink className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Edit" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            title={status === "published" ? "Unpublish" : "Publish"}
            onClick={toggleStatus}
          >
            {status === "published" ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </IconBtn>
          <IconBtn title="Duplicate" onClick={dup}>
            <Copy className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Delete" onClick={del} danger>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </td>
    </tr>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  href,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}) {
  const cls = `inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-muted ${
    danger ? "text-destructive" : "text-muted-foreground hover:text-foreground"
  }`;
  if (href)
    return (
      <Link href={href} title={title} target="_blank" className={cls}>
        {children}
      </Link>
    );
  return (
    <button type="button" title={title} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: ExperienceStatus }) {
  const map: Record<ExperienceStatus, string> = {
    published: "bg-primary/10 text-primary",
    draft: "bg-amber-500/10 text-amber-700",
    archived: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

/* ================================================================== *
 * Form
 * ================================================================== */

const EMPTY: Experience = {
  slug: "",
  name: "",
  blurb: "",
  image: { src: "", alt: "" },
  status: "draft",
  currency: CURRENCY,
  country: "India",
  languages: [],
  highlights: [],
  itinerary: [],
  included: [],
  excluded: [],
  thingsToCarry: [],
  gallery: [],
  faqs: [],
  tags: [],
};

function ExperienceForm({
  initial,
  categories,
  hosts,
  onClose,
}: {
  initial?: Experience;
  categories: ExperienceCategory[];
  hosts: ExperienceHost[];
  allSlugs: string[];
  onClose: () => void;
}) {
  const [d, setD] = useState<Experience>(initial ?? EMPTY);
  const [pending, start] = useTransition();
  const set = (patch: Partial<Experience>) => setD((prev) => ({ ...prev, ...patch }));

  const langCsv = useMemo(() => (d.languages ?? []).join(", "), [d.languages]);
  const tagCsv = useMemo(() => (d.tags ?? []).join(", "), [d.tags]);

  function submit() {
    if (d.name.trim().length < 2) return toast.error("Name is required.");
    if (!d.image.src) return toast.error("A cover image is required.");
    start(async () => {
      const payload: Experience = {
        ...d,
        image: { src: d.image.src, alt: d.image.alt || d.name },
      };
      const res = await saveExperience(payload, initial?.slug);
      if (res.ok) {
        toast.success(initial ? "Saved" : "Created");
        onClose();
      } else toast.error(res.error ?? "Could not save");
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">
          {initial ? `Edit “${initial.name}”` : "New experience"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Basics */}
      <Card title="Basics">
        <Grid>
          <FieldText label="Name *" value={d.name} onChange={(v) => set({ name: v })} />
          <FieldSelect
            label="Status"
            value={d.status ?? "draft"}
            onChange={(v) => set({ status: v as ExperienceStatus })}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <FieldSelect
            label="Category"
            value={d.category ?? ""}
            onChange={(v) => set({ category: v || undefined })}
            options={[
              { value: "", label: "—" },
              ...categories.map((c) => ({ value: c.slug, label: c.name })),
            ]}
          />
          <FieldSelect
            label="Host"
            value={d.hostId ?? ""}
            onChange={(v) => set({ hostId: v || undefined })}
            options={[
              { value: "", label: "—" },
              ...hosts.map((h) => ({ value: h.id, label: h.name })),
            ]}
          />
          <FieldText label="City" value={d.city ?? ""} onChange={(v) => set({ city: v, citySlug: v ? slugify(v) : undefined })} />
          <FieldText label="State" value={d.state ?? ""} onChange={(v) => set({ state: v })} />
        </Grid>
        <FieldText label="Subtitle" value={d.subtitle ?? ""} onChange={(v) => set({ subtitle: v })} placeholder="Taste. Wander. Connect." />
        <FieldTextarea label="Short blurb (cards)" value={d.blurb} onChange={(v) => set({ blurb: v })} rows={2} />
        <FieldTextarea label="Overview (detail page)" value={d.overview ?? ""} onChange={(v) => set({ overview: v })} rows={4} />
        <div className="flex flex-wrap gap-6">
          <FieldToggle label="Featured" value={!!d.featured} onChange={(v) => set({ featured: v })} />
          <FieldToggle label="Trending" value={!!d.trending} onChange={(v) => set({ trending: v })} />
          <FieldToggle label="Private available" value={!!d.privateAvailable} onChange={(v) => set({ privateAvailable: v })} />
          <FieldToggle label="Pickup available" value={!!d.pickupAvailable} onChange={(v) => set({ pickupAvailable: v })} />
        </div>
      </Card>

      {/* Cover */}
      <Card title="Cover image *">
        <CoverPicker
          src={d.image.src}
          onChange={(src) => set({ image: { src, alt: d.image.alt } })}
        />
      </Card>

      {/* Pricing & logistics */}
      <Card title="Pricing & logistics">
        <Grid>
          <FieldNumber label="Price from (₹)" value={d.priceFrom} onChange={(v) => set({ priceFrom: v })} />
          <FieldText label="Duration" value={d.duration ?? ""} onChange={(v) => set({ duration: v })} placeholder="3 Hours" />
          <FieldText label="Duration label" value={d.durationLabel ?? ""} onChange={(v) => set({ durationLabel: v })} placeholder="4:30 PM – 7:30 PM" />
          <FieldNumber label="Group min" value={d.groupMin} onChange={(v) => set({ groupMin: v })} />
          <FieldNumber label="Group max" value={d.groupMax} onChange={(v) => set({ groupMax: v })} />
          <FieldSelect
            label="Difficulty"
            value={d.difficulty ?? ""}
            onChange={(v) => set({ difficulty: (v || undefined) as Experience["difficulty"] })}
            options={[
              { value: "", label: "—" },
              { value: "Easy", label: "Easy" },
              { value: "Moderate", label: "Moderate" },
              { value: "Challenging", label: "Challenging" },
            ]}
          />
          <FieldText label="Age limit" value={d.ageLimit ?? ""} onChange={(v) => set({ ageLimit: v })} placeholder="8+" />
          <FieldText label="Meals included" value={d.mealsIncluded ?? ""} onChange={(v) => set({ mealsIncluded: v })} placeholder="8+ Tastings" />
          <FieldNumber label="Rating (0–5)" value={d.rating} onChange={(v) => set({ rating: v })} step="0.1" />
          <FieldNumber label="Review count" value={d.reviewCount} onChange={(v) => set({ reviewCount: v })} />
        </Grid>
        <FieldText label="Meeting point" value={d.meetingPoint ?? ""} onChange={(v) => set({ meetingPoint: v })} />
        <FieldText label="Pickup note" value={d.pickupNote ?? ""} onChange={(v) => set({ pickupNote: v })} placeholder="Complimentary pickup from Panjim" />
        <FieldText label="Accessibility" value={d.accessibility ?? ""} onChange={(v) => set({ accessibility: v })} />
        <FieldText
          label="Languages (comma-separated)"
          value={langCsv}
          onChange={(v) => set({ languages: splitCsv(v) })}
        />
        <FieldTextarea label="Cancellation policy" value={d.cancellationPolicy ?? ""} onChange={(v) => set({ cancellationPolicy: v })} rows={2} />
      </Card>

      {/* Highlights */}
      <Card title="Experience highlights">
        <StringList items={d.highlights ?? []} onChange={(highlights) => set({ highlights })} placeholder="Add a highlight" />
      </Card>

      {/* Timeline */}
      <Card title="Your Journey (timeline)">
        <TimelineEditor stops={d.itinerary ?? []} onChange={(itinerary) => set({ itinerary })} />
      </Card>

      {/* Included / excluded */}
      <Card title="What's included">
        <StringList items={d.included ?? []} onChange={(included) => set({ included })} placeholder="e.g. Local guide" />
      </Card>
      <Card title="What's not included">
        <StringList items={d.excluded ?? []} onChange={(excluded) => set({ excluded })} placeholder="e.g. Alcohol" />
      </Card>

      {/* Things to carry */}
      <Card title="Things to carry">
        <CarryEditor items={d.thingsToCarry ?? []} onChange={(thingsToCarry) => set({ thingsToCarry })} />
      </Card>

      {/* Gallery */}
      <Card title="Gallery">
        <GalleryEditor photos={d.gallery ?? []} onChange={(gallery) => set({ gallery })} />
      </Card>

      {/* FAQ */}
      <Card title="FAQs">
        <FaqEditor faqs={d.faqs ?? []} onChange={(faqs) => set({ faqs })} />
      </Card>

      {/* SEO */}
      <Card title="SEO & meta">
        <FieldText label="Meta title" value={d.metaTitle ?? ""} onChange={(v) => set({ metaTitle: v })} />
        <FieldTextarea label="Meta description" value={d.metaDescription ?? ""} onChange={(v) => set({ metaDescription: v })} rows={2} />
        <FieldText label="Tags (comma-separated)" value={tagCsv} onChange={(v) => set({ tags: splitCsv(v) })} />
      </Card>

      <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-border/60 bg-background/95 py-4 backdrop-blur">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={pending} className="rounded-md">
          {pending ? "Saving…" : initial ? "Save changes" : "Create experience"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------- small helpers ------------------------- */

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function splitCsv(v: string) {
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="font-display text-lg">{title}</h3>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function FieldText({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <FieldWrap label={label}>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </FieldWrap>
  );
}
function FieldTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <FieldWrap label={label}>
      <Textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />
    </FieldWrap>
  );
}
function FieldNumber({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  step?: string;
}) {
  return (
    <FieldWrap label={label}>
      <Input
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </FieldWrap>
  );
}
function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <FieldWrap label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}
function FieldToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="accent-primary" />
      {label}
    </label>
  );
}

function CoverPicker({ src, onChange }: { src: string; onChange: (src: string) => void }) {
  const [uploading, setUploading] = useState(false);
  if (src) {
    return (
      <div className="overflow-hidden rounded-lg border border-border/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="aspect-[16/9] w-full object-cover" />
        <div className="flex items-center justify-between border-t border-border/60 px-3 py-2">
          <span className="truncate text-xs text-muted-foreground">{src.split("/").pop()}</span>
          <div className="flex items-center gap-2">
            <ImageUploadButton label="Replace" onUploadStart={() => setUploading(true)} onUploaded={(url) => { setUploading(false); onChange(url); }} />
            <button type="button" onClick={() => onChange("")} className="text-xs text-destructive hover:underline">Remove</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
      <p className="text-sm text-muted-foreground">{uploading ? "Uploading…" : "Upload a cover image"}</p>
      <div className="mt-3">
        <ImageUploadButton label="Choose image" onUploadStart={() => setUploading(true)} onUploaded={(url) => { setUploading(false); onChange(url); }} />
      </div>
    </div>
  );
}

function StringList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <Reorder i={i} len={items.length} onMove={(from, to) => onChange(move(items, from, to))} />
          <RemoveBtn onClick={() => onChange(items.filter((_, j) => j !== i))} />
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              onChange([...items, draft.trim()]);
              setDraft("");
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); } }}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CarryEditor({ items, onChange }: { items: CarryItem[]; onChange: (i: CarryItem[]) => void }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input className="flex-1" value={it.label} placeholder="Label" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
          <Input className="w-40" value={it.icon ?? ""} placeholder="Icon (e.g. Camera)" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, icon: e.target.value || undefined } : x)))} />
          <RemoveBtn onClick={() => onChange(items.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { label: "" }])}>
        <Plus className="mr-1 h-4 w-4" /> Add item
      </Button>
    </div>
  );
}

function TimelineEditor({ stops, onChange }: { stops: ItineraryStop[]; onChange: (s: ItineraryStop[]) => void }) {
  const upd = (i: number, patch: Partial<ItineraryStop>) =>
    onChange(stops.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-3">
      {stops.map((s, i) => (
        <div key={s.id} className="rounded-lg border border-border/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <GripVertical className="h-3.5 w-3.5" /> Stop {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <Reorder i={i} len={stops.length} onMove={(from, to) => onChange(move(stops, from, to))} />
              <RemoveBtn onClick={() => onChange(stops.filter((_, j) => j !== i))} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Time (4:30 PM)" value={s.time ?? ""} onChange={(e) => upd(i, { time: e.target.value })} />
            <Input className="sm:col-span-2" placeholder="Title" value={s.title} onChange={(e) => upd(i, { title: e.target.value })} />
          </div>
          <Textarea className="mt-2" rows={2} placeholder="Description" value={s.description ?? ""} onChange={(e) => upd(i, { description: e.target.value })} />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Input placeholder="Duration (30 min)" value={s.duration ?? ""} onChange={(e) => upd(i, { duration: e.target.value })} />
            <div className="flex items-center gap-2">
              {s.photo?.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photo.src} alt="" className="h-9 w-12 rounded object-cover" />
              )}
              <ImageUploadButton
                label={s.photo?.src ? "Replace photo" : "Add photo"}
                onUploaded={(url) => upd(i, { photo: { src: url, alt: s.title } })}
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...stops, { id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, title: "" }])}
      >
        <Plus className="mr-1 h-4 w-4" /> Add stop
      </Button>
    </div>
  );
}

function GalleryEditor({ photos, onChange }: { photos: ExperiencePhoto[]; onChange: (p: ExperiencePhoto[]) => void }) {
  const cats = ["places", "food", "guests", "videos"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((p, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-border/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.alt} className="aspect-square w-full object-cover" />
            <div className="space-y-1 p-2">
              <select
                value={p.category ?? "places"}
                onChange={(e) => onChange(photos.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))}
                className="w-full rounded border border-input bg-transparent px-1.5 py-1 text-xs"
              >
                {cats.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))} className="w-full text-xs text-destructive hover:underline">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <ImageUploadButton
        label="Add photo"
        onUploaded={(url) => onChange([...photos, { src: url, alt: "", category: "places" }])}
      />
    </div>
  );
}

function FaqEditor({ faqs, onChange }: { faqs: { question: string; answer: string }[]; onChange: (f: { question: string; answer: string }[]) => void }) {
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <div key={i} className="rounded-lg border border-border/60 p-3">
          <div className="flex items-center gap-2">
            <Input className="flex-1" placeholder="Question" value={f.question} onChange={(e) => onChange(faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
            <RemoveBtn onClick={() => onChange(faqs.filter((_, j) => j !== i))} />
          </div>
          <Textarea className="mt-2" rows={2} placeholder="Answer" value={f.answer} onChange={(e) => onChange(faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...faqs, { question: "", answer: "" }])}>
        <Plus className="mr-1 h-4 w-4" /> Add FAQ
      </Button>
    </div>
  );
}

function Reorder({ i, len, onMove }: { i: number; len: number; onMove: (from: number, to: number) => void }) {
  return (
    <div className="flex flex-col">
      <button type="button" disabled={i === 0} onClick={() => onMove(i, i - 1)} className="text-muted-foreground disabled:opacity-30 hover:text-foreground" aria-label="Move up">
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" disabled={i === len - 1} onClick={() => onMove(i, i + 1)} className="text-muted-foreground disabled:opacity-30 hover:text-foreground" aria-label="Move down">
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10" aria-label="Remove">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
