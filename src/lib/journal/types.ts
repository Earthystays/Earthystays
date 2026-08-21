import type { Image } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════════
 * THE EARTHY JOURNAL — content model
 *
 * Storage mirrors the rest of the app: plain JSON files in /data read &
 * written through src/lib/storage.ts. Articles carry a block-based body so
 * the eventual visual editor and the JSON authored today share one schema.
 * Properties / experiences / destinations are NEVER duplicated here — embed
 * blocks store only a slug and resolve live against the central stores.
 * ═══════════════════════════════════════════════════════════════════════ */

export type JournalStatus =
  | "draft"
  | "in_review"
  | "scheduled"
  | "published"
  | "archived";

/* ─────────────────────────── Content blocks ─────────────────────────── */

export type BlockBase = { id: string };

export type ParagraphBlock = BlockBase & { type: "paragraph"; text: string };
export type HeadingBlock = BlockBase & {
  type: "heading";
  level: 2 | 3;
  text: string;
};
export type QuoteBlock = BlockBase & {
  type: "quote";
  text: string;
  cite?: string;
};
export type CalloutBlock = BlockBase & {
  type: "callout";
  tone?: "sage" | "sand" | "terracotta";
  title?: string;
  text: string;
};
export type HighlightBlock = BlockBase & { type: "highlight"; text: string };

export type ImageBlock = BlockBase & {
  type: "image";
  image: Image;
  caption?: string;
  credit?: string;
  fullWidth?: boolean;
};
export type GalleryBlock = BlockBase & {
  type: "gallery";
  images: Image[];
  caption?: string;
};
export type VideoBlock = BlockBase & {
  type: "video";
  kind: "youtube" | "vimeo" | "file";
  /** YouTube / Vimeo video id (distinct from the block's own `id`). */
  videoId?: string;
  src?: string;
  poster?: string;
  caption?: string;
};

/** Embeds — store a slug only; the renderer resolves live data. */
export type PropertyEmbedBlock = BlockBase & { type: "property"; slug: string };
export type ExperienceEmbedBlock = BlockBase & {
  type: "experience";
  slug: string;
};

export type RelatedPropertiesBlock = BlockBase & {
  type: "relatedProperties";
  slugs: string[];
  title?: string;
};
export type RelatedExperiencesBlock = BlockBase & {
  type: "relatedExperiences";
  slugs: string[];
  title?: string;
};

export type CtaBlock = BlockBase & {
  type: "cta";
  variant?: "default" | "booking" | "newsletter";
  heading: string;
  body?: string;
  buttonLabel?: string;
  buttonHref?: string;
};
export type ButtonBlock = BlockBase & {
  type: "button";
  label: string;
  href: string;
};
export type TableBlock = BlockBase & {
  type: "table";
  headers: string[];
  rows: string[][];
};
export type FaqBlock = BlockBase & {
  type: "faq";
  items: Array<{ question: string; answer: string }>;
};
export type DividerBlock = BlockBase & { type: "divider" };

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | CalloutBlock
  | HighlightBlock
  | ImageBlock
  | GalleryBlock
  | VideoBlock
  | PropertyEmbedBlock
  | ExperienceEmbedBlock
  | RelatedPropertiesBlock
  | RelatedExperiencesBlock
  | CtaBlock
  | ButtonBlock
  | TableBlock
  | FaqBlock
  | DividerBlock;

export type BlockType = ContentBlock["type"];

/* ─────────────────────────── SEO metadata ──────────────────────────── */

export type JournalSeo = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterImage?: string;
  focusKeyword?: string;
  relatedKeywords?: string[];
  noindex?: boolean;
};

/* ─────────────────────────── Core entities ─────────────────────────── */

export type JournalArticle = {
  id: string;
  slug: string;
  /** Old slugs that must 301 → the current one. */
  previousSlugs?: string[];

  title: string;
  subtitle?: string;
  excerpt: string;

  categorySlug: string;
  tags: string[];
  authorId?: string;
  /** Journal destination slug (see JournalDestination). */
  destinationSlug?: string;

  heroImage?: Image;
  mobileHeroImage?: Image;
  heroCaption?: string;
  heroCredit?: string;

  /** Minutes; auto-estimated from blocks when unset. */
  readingTime?: number;

  blocks: ContentBlock[];

  status: JournalStatus;
  featured?: boolean;
  /** 1-based slot in Editor's Picks; unset = not picked. */
  editorsPickRank?: number;
  /** Manual override of auto "Keep exploring" recommendations. */
  relatedArticleSlugs?: string[];

  seo?: JournalSeo;

  /* Lifecycle */
  publishedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;

  /* Aggregate attribution counters (incremented by /api/journal/track). */
  views?: number;
  propertyClicks?: number;
  experienceClicks?: number;
  bookingClicks?: number;
  shares?: number;
};

export type JournalCategory = {
  slug: string;
  name: string;
  description?: string;
  image?: Image;
  order: number;
  enabled: boolean;
  seo?: JournalSeo;
};

export type JournalDestination = {
  slug: string;
  name: string;
  location?: string;
  description?: string;
  image?: Image;
  /** Central-store slugs — resolved live, never duplicated. */
  relatedPropertySlugs?: string[];
  relatedExperienceSlugs?: string[];
  order: number;
  enabled: boolean;
  seo?: JournalSeo;
};

export type JournalAuthor = {
  id: string;
  slug: string;
  name: string;
  role?: string;
  bio?: string;
  avatar?: Image;
  socials?: { instagram?: string; x?: string; website?: string };
};

export type JournalTag = { slug: string; name: string };

/** One captured version of an article body, for restore. */
export type JournalRevision = {
  id: string;
  articleId: string;
  version: number;
  updatedBy?: string;
  updatedAt: string;
  note?: string;
  snapshot: JournalArticle;
};

export type JournalSubscriber = {
  email: string;
  status: "subscribed" | "unsubscribed";
  source?: string;
  subscribedAt: string;
  unsubscribedAt?: string;
  /** Opaque token for one-click unsubscribe links. */
  token: string;
};

/* ──────────────────────────── Media library ────────────────────────── */

export type JournalMedia = {
  id: string;
  url: string;
  /** Original filename at upload time. */
  fileName: string;
  kind: "image" | "video" | "pdf";
  sizeBytes?: number;
  alt?: string;
  caption?: string;
  credit?: string;
  /** Free-form grouping, e.g. "Goa", "Heroes". */
  folder?: string;
  uploadedAt: string;
};

/* ───────────────────────── Seasonal campaigns ───────────────────────── */

export type JournalCampaign = {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  /** ISO dates; the campaign banner shows only within this window. */
  startsAt?: string;
  endsAt?: string;
  headline: string;
  description?: string;
  image?: Image;
  ctaLabel?: string;
  ctaHref?: string;
  /** Curated slugs, resolved live. */
  articleSlugs?: string[];
  propertySlugs?: string[];
  experienceSlugs?: string[];
  createdAt: string;
  updatedAt: string;
};

/* ─────────────────────── Homepage configuration ────────────────────── */

export type HomepageSectionKey =
  | "hero"
  | "categories"
  | "editorsPicks"
  | "destinations"
  | "latest"
  | "stays"
  | "experiences"
  | "instagram"
  | "newsletter";

export type JournalHomepage = {
  hero: {
    enabled: boolean;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    image?: Image;
    mobileImage?: Image;
  };
  editorsPicks: { enabled: boolean; title: string; description?: string; max: number };
  destinations: { enabled: boolean; title: string; description?: string; slugs: string[] };
  latest: { enabled: boolean; title: string; count: number; categorySlug?: string };
  stays: {
    enabled: boolean;
    title: string;
    description?: string;
    slugs: string[];
    ctaHref: string;
  };
  experiences: {
    enabled: boolean;
    title: string;
    description?: string;
    slugs: string[];
    ctaHref: string;
  };
  instagram: {
    enabled: boolean;
    handle: string;
    url: string;
    images: Image[];
  };
  newsletter: { enabled: boolean; title: string; description?: string };
  categoriesEnabled: boolean;
  /** Drag-to-reorder order of the homepage sections. */
  order: HomepageSectionKey[];
};
