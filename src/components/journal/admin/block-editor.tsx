"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Heading,
  Quote as QuoteIcon,
  ImagePlus,
  Images,
  Video,
  Building2,
  Compass,
  Megaphone,
  Minus,
  HelpCircle,
  Table as TableIcon,
  Layers,
  MapPin,
} from "lucide-react";
import type { ContentBlock, BlockType } from "@/lib/journal/types";
import { ImageUploadButton } from "@/components/image-upload-button";
import { EntityPicker, MultiEntityPicker, type EntityOption } from "./entity-picker";

export type BlockEditorOptions = {
  properties: EntityOption[];
  experiences: EntityOption[];
  destinations: EntityOption[];
  collections: EntityOption[];
};

let uid = 0;
const newId = () => `b-${Date.now().toString(36)}-${uid++}`;

const MENU: Array<{ type: BlockType; label: string; icon: typeof Type }> = [
  { type: "paragraph", label: "Paragraph", icon: Type },
  { type: "heading", label: "Heading", icon: Heading },
  { type: "quote", label: "Quote", icon: QuoteIcon },
  { type: "callout", label: "Callout", icon: Megaphone },
  { type: "highlight", label: "Highlight", icon: Type },
  { type: "image", label: "Image", icon: ImagePlus },
  { type: "gallery", label: "Gallery", icon: Images },
  { type: "video", label: "Video", icon: Video },
  { type: "property", label: "Property", icon: Building2 },
  { type: "experience", label: "Experience", icon: Compass },
  { type: "collection", label: "Collection", icon: Layers },
  { type: "destination", label: "Destination", icon: MapPin },
  { type: "relatedProperties", label: "Related stays", icon: Building2 },
  { type: "relatedExperiences", label: "Related experiences", icon: Compass },
  { type: "cta", label: "Call to action", icon: Megaphone },
  { type: "button", label: "Button", icon: Megaphone },
  { type: "table", label: "Table", icon: TableIcon },
  { type: "faq", label: "FAQ", icon: HelpCircle },
  { type: "divider", label: "Divider", icon: Minus },
];

function blankBlock(type: BlockType): ContentBlock {
  const id = newId();
  switch (type) {
    case "paragraph": return { id, type, text: "" };
    case "heading": return { id, type, level: 2, text: "" };
    case "quote": return { id, type, text: "", cite: "" };
    case "callout": return { id, type, tone: "sand", title: "", text: "" };
    case "highlight": return { id, type, text: "" };
    case "image": return { id, type, image: { src: "", alt: "" }, caption: "", credit: "" };
    case "gallery": return { id, type, images: [], caption: "" };
    case "video": return { id, type, kind: "youtube", videoId: "", caption: "" };
    case "property": return { id, type, slug: "" };
    case "experience": return { id, type, slug: "" };
    case "collection": return { id, type, slug: "" };
    case "destination": return { id, type, slug: "" };
    case "relatedProperties": return { id, type, slugs: [], title: "" };
    case "relatedExperiences": return { id, type, slugs: [], title: "" };
    case "cta": return { id, type, variant: "default", heading: "", body: "", buttonLabel: "", buttonHref: "" };
    case "button": return { id, type, label: "", href: "" };
    case "table": return { id, type, headers: ["", ""], rows: [["", ""]] };
    case "faq": return { id, type, items: [{ question: "", answer: "" }] };
    case "divider": return { id, type };
    default: return { id, type: "paragraph", text: "" };
  }
}

const field =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-forest";

export function BlockEditor({
  blocks,
  onChange,
  options,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  options: BlockEditorOptions;
}) {
  const [adding, setAdding] = useState(false);

  const patch = (id: string, partial: Partial<ContentBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...partial } as ContentBlock) : b)));
  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (type: BlockType) => {
    onChange([...blocks, blankBlock(type)]);
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <div key={block.id} className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {block.type}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move up">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move down">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => remove(block.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete block">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <BlockFields block={block} patch={patch} options={options} />
        </div>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-forest hover:text-forest"
        >
          <Plus className="h-4 w-4" /> Add block
        </button>
        {adding && (
          <div className="absolute z-20 mt-1 grid w-full grid-cols-2 gap-1 rounded-lg border border-border bg-popover p-2 shadow-lg sm:grid-cols-3">
            {MENU.map((m) => (
              <button
                key={m.type}
                type="button"
                onClick={() => add(m.type)}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
              >
                <m.icon className="h-4 w-4 text-muted-foreground" />
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockFields({
  block,
  patch,
  options,
}: {
  block: ContentBlock;
  patch: (id: string, partial: Partial<ContentBlock>) => void;
  options: BlockEditorOptions;
}) {
  switch (block.type) {
    case "paragraph":
    case "highlight":
      return (
        <textarea rows={3} value={block.text} onChange={(e) => patch(block.id, { text: e.target.value })} className={field} placeholder="Write…" />
      );

    case "heading":
      return (
        <div className="flex gap-2">
          <select value={block.level} onChange={(e) => patch(block.id, { level: Number(e.target.value) as 2 | 3 })} className={`${field} w-24`}>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input value={block.text} onChange={(e) => patch(block.id, { text: e.target.value })} className={field} placeholder="Heading text" />
        </div>
      );

    case "quote":
      return (
        <div className="space-y-2">
          <textarea rows={2} value={block.text} onChange={(e) => patch(block.id, { text: e.target.value })} className={field} placeholder="Quote" />
          <input value={block.cite ?? ""} onChange={(e) => patch(block.id, { cite: e.target.value })} className={field} placeholder="Attribution (optional)" />
        </div>
      );

    case "callout":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select value={block.tone ?? "sand"} onChange={(e) => patch(block.id, { tone: e.target.value as "sage" | "sand" | "terracotta" })} className={`${field} w-32`}>
              <option value="sand">Sand</option>
              <option value="sage">Sage</option>
              <option value="terracotta">Terracotta</option>
            </select>
            <input value={block.title ?? ""} onChange={(e) => patch(block.id, { title: e.target.value })} className={field} placeholder="Title (optional)" />
          </div>
          <textarea rows={2} value={block.text} onChange={(e) => patch(block.id, { text: e.target.value })} className={field} placeholder="Callout text" />
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          {block.image.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.image.src} alt="" className="h-32 w-full rounded-md object-cover" />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <ImageUploadButton onUploaded={(url) => patch(block.id, { image: { ...block.image, src: url } })} label={block.image.src ? "Replace image" : "Upload image"} />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={!!block.fullWidth} onChange={(e) => patch(block.id, { fullWidth: e.target.checked })} />
              Full width
            </label>
          </div>
          <input value={block.image.alt} onChange={(e) => patch(block.id, { image: { ...block.image, alt: e.target.value } })} className={field} placeholder="Alt text (accessibility)" />
          <input value={block.caption ?? ""} onChange={(e) => patch(block.id, { caption: e.target.value })} className={field} placeholder="Caption (optional)" />
          <input value={block.credit ?? ""} onChange={(e) => patch(block.id, { credit: e.target.value })} className={field} placeholder="Credit (optional)" />
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {block.images.map((img, idx) => (
              <div key={idx} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" className="aspect-square w-full rounded-md object-cover" />
                <button type="button" onClick={() => patch(block.id, { images: block.images.filter((_, k) => k !== idx) })} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-destructive text-white" aria-label="Remove">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <ImageUploadButton onUploaded={(url, name) => patch(block.id, { images: [...block.images, { src: url, alt: name }] })} label="Add photo" />
          <input value={block.caption ?? ""} onChange={(e) => patch(block.id, { caption: e.target.value })} className={field} placeholder="Caption (optional)" />
        </div>
      );

    case "video":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select value={block.kind} onChange={(e) => patch(block.id, { kind: e.target.value as "youtube" | "vimeo" | "file" })} className={`${field} w-32`}>
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="file">File URL</option>
            </select>
            {block.kind === "file" ? (
              <input value={block.src ?? ""} onChange={(e) => patch(block.id, { src: e.target.value })} className={field} placeholder="Video file URL" />
            ) : (
              <input value={block.videoId ?? ""} onChange={(e) => patch(block.id, { videoId: e.target.value })} className={field} placeholder="Video ID" />
            )}
          </div>
          <input value={block.caption ?? ""} onChange={(e) => patch(block.id, { caption: e.target.value })} className={field} placeholder="Caption (optional)" />
        </div>
      );

    case "property":
      return <EntityPicker options={options.properties} value={block.slug} onChange={(slug) => patch(block.id, { slug })} placeholder="Search properties…" />;

    case "experience":
      return <EntityPicker options={options.experiences} value={block.slug} onChange={(slug) => patch(block.id, { slug })} placeholder="Search experiences…" />;

    case "collection":
      return <EntityPicker options={options.collections} value={block.slug} onChange={(slug) => patch(block.id, { slug })} placeholder="Search collections…" />;

    case "destination":
      return <EntityPicker options={options.destinations} value={block.slug} onChange={(slug) => patch(block.id, { slug })} placeholder="Search destinations…" />;

    case "relatedProperties":
      return (
        <div className="space-y-2">
          <input value={block.title ?? ""} onChange={(e) => patch(block.id, { title: e.target.value })} className={field} placeholder="Section title (optional)" />
          <MultiEntityPicker options={options.properties} values={block.slugs} onChange={(slugs) => patch(block.id, { slugs })} placeholder="Add property…" />
        </div>
      );

    case "relatedExperiences":
      return (
        <div className="space-y-2">
          <input value={block.title ?? ""} onChange={(e) => patch(block.id, { title: e.target.value })} className={field} placeholder="Section title (optional)" />
          <MultiEntityPicker options={options.experiences} values={block.slugs} onChange={(slugs) => patch(block.id, { slugs })} placeholder="Add experience…" />
        </div>
      );

    case "cta":
      return (
        <div className="space-y-2">
          <select value={block.variant ?? "default"} onChange={(e) => patch(block.id, { variant: e.target.value as "default" | "booking" | "newsletter" })} className={`${field} w-40`}>
            <option value="default">Default</option>
            <option value="booking">Booking</option>
            <option value="newsletter">Newsletter</option>
          </select>
          <input value={block.heading} onChange={(e) => patch(block.id, { heading: e.target.value })} className={field} placeholder="Heading" />
          <input value={block.body ?? ""} onChange={(e) => patch(block.id, { body: e.target.value })} className={field} placeholder="Body (optional)" />
          <div className="flex gap-2">
            <input value={block.buttonLabel ?? ""} onChange={(e) => patch(block.id, { buttonLabel: e.target.value })} className={field} placeholder="Button label" />
            <input value={block.buttonHref ?? ""} onChange={(e) => patch(block.id, { buttonHref: e.target.value })} className={field} placeholder="Button link" />
          </div>
        </div>
      );

    case "button":
      return (
        <div className="flex gap-2">
          <input value={block.label} onChange={(e) => patch(block.id, { label: e.target.value })} className={field} placeholder="Label" />
          <input value={block.href} onChange={(e) => patch(block.id, { href: e.target.value })} className={field} placeholder="Link" />
        </div>
      );

    case "table":
      return (
        <div className="space-y-2">
          <input
            value={block.headers.join(" | ")}
            onChange={(e) => patch(block.id, { headers: e.target.value.split("|").map((s) => s.trim()) })}
            className={field}
            placeholder="Header 1 | Header 2 | Header 3"
          />
          <textarea
            rows={4}
            value={block.rows.map((r) => r.join(" | ")).join("\n")}
            onChange={(e) => patch(block.id, { rows: e.target.value.split("\n").filter(Boolean).map((line) => line.split("|").map((s) => s.trim())) })}
            className={field}
            placeholder="One row per line, cells separated by |"
          />
          <p className="text-xs text-muted-foreground">One row per line. Separate cells with the “|” character.</p>
        </div>
      );

    case "faq":
      return (
        <div className="space-y-2">
          {block.items.map((item, idx) => (
            <div key={idx} className="space-y-1 rounded-md border border-border/60 p-2">
              <div className="flex gap-2">
                <input value={item.question} onChange={(e) => patch(block.id, { items: block.items.map((it, k) => (k === idx ? { ...it, question: e.target.value } : it)) })} className={field} placeholder="Question" />
                <button type="button" onClick={() => patch(block.id, { items: block.items.filter((_, k) => k !== idx) })} className="rounded p-1 text-muted-foreground hover:text-destructive" aria-label="Remove FAQ">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea rows={2} value={item.answer} onChange={(e) => patch(block.id, { items: block.items.map((it, k) => (k === idx ? { ...it, answer: e.target.value } : it)) })} className={field} placeholder="Answer" />
            </div>
          ))}
          <button type="button" onClick={() => patch(block.id, { items: [...block.items, { question: "", answer: "" }] })} className="text-sm text-forest hover:underline">
            + Add question
          </button>
        </div>
      );

    case "divider":
      return <p className="text-xs text-muted-foreground">A horizontal divider.</p>;

    default:
      return null;
  }
}
