import Link from "next/link";
import Image from "next/image";
import { Quote, ArrowRight } from "lucide-react";
import type { ContentBlock, HeadingBlock } from "@/lib/journal/types";
import { slugify } from "@/lib/slug";
import { getVillaBySlug, getVillasByCollection } from "@/lib/data/villas";
import { getPublishedExperienceBySlug } from "@/lib/data/experiences";
import { getCollectionBySlug } from "@/lib/data/collections";
import { getJournalDestinationBySlug } from "@/lib/data/journal-destinations";
import {
  PropertyEmbedCard,
  ExperienceEmbedCard,
  CollectionEmbedCard,
  DestinationEmbedCard,
} from "./embed-cards";

/** Stable anchor id for a heading block — matches the TOC. */
export function headingId(b: HeadingBlock): string {
  return `h-${slugify(b.text)}`;
}

const calloutTone: Record<string, string> = {
  sage: "border-forest/25 bg-sage/15",
  sand: "border-border/60 bg-beige/40",
  terracotta: "border-terracotta/30 bg-terracotta/10",
};

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-[17px] leading-[1.8] text-foreground/90">
          {block.text}
        </p>
      );

    case "heading": {
      const id = headingId(block);
      if (block.level === 3)
        return (
          <h3 id={id} className="scroll-mt-28 pt-2 text-xl font-semibold text-foreground">
            {block.text}
          </h3>
        );
      return (
        <h2 id={id} className="scroll-mt-28 pt-4 text-2xl font-semibold text-foreground sm:text-[28px]">
          {block.text}
        </h2>
      );
    }

    case "highlight":
      return (
        <p className="text-xl font-medium leading-relaxed text-foreground">
          {block.text}
        </p>
      );

    case "quote":
      return (
        <figure className="my-8 border-l-2 border-forest/40 pl-6">
          <Quote className="mb-2 h-6 w-6 text-forest/40" />
          <blockquote className="font-serif text-2xl leading-snug text-foreground">
            {block.text}
          </blockquote>
          {block.cite && (
            <figcaption className="mt-3 text-sm text-muted-foreground">
              — {block.cite}
            </figcaption>
          )}
        </figure>
      );

    case "callout":
      return (
        <aside
          className={`my-8 rounded-2xl border p-6 ${
            calloutTone[block.tone ?? "sand"] ?? calloutTone.sand
          }`}
        >
          {block.title && (
            <p className="mb-1.5 font-semibold text-foreground">{block.title}</p>
          )}
          <p className="text-foreground/85">{block.text}</p>
        </aside>
      );

    case "image":
      return (
        <figure className={block.fullWidth ? "my-10 lg:-mx-24" : "my-8"}>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
            <Image
              src={block.image.src}
              alt={block.image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
          {(block.caption || block.credit) && (
            <figcaption className="mt-2.5 text-sm text-muted-foreground">
              {block.caption}
              {block.credit && (
                <span className="text-muted-foreground/70"> · {block.credit}</span>
              )}
            </figcaption>
          )}
        </figure>
      );

    case "gallery":
      return (
        <figure className="my-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {block.images.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 250px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          {block.caption && (
            <figcaption className="mt-2.5 text-sm text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "video": {
      const src =
        block.kind === "youtube"
          ? `https://www.youtube.com/embed/${block.videoId}`
          : block.kind === "vimeo"
            ? `https://player.vimeo.com/video/${block.videoId}`
            : undefined;
      return (
        <figure className="my-8">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
            {block.kind === "file" ? (
              <video
                src={block.src}
                poster={block.poster}
                controls
                className="h-full w-full"
              />
            ) : (
              <iframe
                src={src}
                title={block.caption || "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            )}
          </div>
          {block.caption && (
            <figcaption className="mt-2.5 text-sm text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "property": {
      const villa = getVillaBySlug(block.slug);
      return villa ? <PropertyEmbedCard villa={villa} /> : null;
    }

    case "experience": {
      const exp = getPublishedExperienceBySlug(block.slug);
      return exp ? <ExperienceEmbedCard exp={exp} /> : null;
    }

    case "collection": {
      const collection = getCollectionBySlug(block.slug);
      if (!collection) return null;
      return (
        <CollectionEmbedCard
          collection={collection}
          count={getVillasByCollection(collection.slug).length}
        />
      );
    }

    case "destination": {
      const dest = getJournalDestinationBySlug(block.slug);
      return dest ? (
        <DestinationEmbedCard
          slug={dest.slug}
          name={dest.name}
          location={dest.location}
          description={dest.description}
        />
      ) : null;
    }

    case "relatedProperties": {
      const villas = block.slugs
        .map((s) => getVillaBySlug(s))
        .filter((v): v is NonNullable<typeof v> => Boolean(v));
      if (!villas.length) return null;
      return (
        <section className="my-10">
          <h3 className="mb-4 text-lg font-semibold">
            {block.title ?? "Related stays"}
          </h3>
          {villas.map((v) => (
            <PropertyEmbedCard key={v.slug} villa={v} />
          ))}
        </section>
      );
    }

    case "relatedExperiences": {
      const exps = block.slugs
        .map((s) => getPublishedExperienceBySlug(s))
        .filter((e): e is NonNullable<typeof e> => Boolean(e));
      if (!exps.length) return null;
      return (
        <section className="my-10">
          <h3 className="mb-4 text-lg font-semibold">
            {block.title ?? "Related experiences"}
          </h3>
          {exps.map((e) => (
            <ExperienceEmbedCard key={e.slug} exp={e} />
          ))}
        </section>
      );
    }

    case "cta":
      return (
        <aside className="my-10 overflow-hidden rounded-3xl bg-forest px-8 py-10 text-center text-white">
          <h3 className="font-serif text-2xl sm:text-3xl">{block.heading}</h3>
          {block.body && (
            <p className="mx-auto mt-2 max-w-lg text-white/85">{block.body}</p>
          )}
          {block.buttonHref && (
            <Link
              href={block.buttonHref}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-forest transition-transform hover:scale-[1.02]"
            >
              {block.buttonLabel ?? "Learn more"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </aside>
      );

    case "button":
      return (
        <div className="my-6">
          <Link
            href={block.href}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            {block.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      );

    case "table":
      return (
        <div className="my-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {block.headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-border/50">
                  {row.map((cell, c) => (
                    <td key={c} className="px-4 py-3 text-foreground/85">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "faq":
      return (
        <section className="my-8 divide-y divide-border/60 rounded-2xl border border-border/60">
          {block.items.map((item, i) => (
            <details key={i} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none">
                {item.question}
              </summary>
              <p className="mt-2 text-foreground/80">{item.answer}</p>
            </details>
          ))}
        </section>
      );

    case "divider":
      return <hr className="my-10 border-border/60" />;

    default:
      return null;
  }
}

export function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b) => (
        <Block key={b.id} block={b} />
      ))}
    </div>
  );
}
