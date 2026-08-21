import type { JournalHomepage, HomepageSectionKey } from "@/lib/journal/types";
import { readJsonSync, readJson, writeJson } from "@/lib/storage";

const FILE = "journal-homepage.json";

export const DEFAULT_ORDER: HomepageSectionKey[] = [
  "hero",
  "categories",
  "editorsPicks",
  "destinations",
  "latest",
  "stays",
  "experiences",
  "instagram",
  "newsletter",
];

export const DEFAULT_HOMEPAGE: JournalHomepage = {
  hero: {
    enabled: true,
    title: "Travel.\nExperience.\nRemember.",
    subtitle:
      "Stories, guides and places worth discovering. Curated for travellers, by the locals.",
    ctaLabel: "Explore Stories",
    ctaHref: "/journal/search",
    image: {
      src: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2000&q=80",
      alt: "Sunset over a palm-fringed Goa coastline",
    },
  },
  editorsPicks: { enabled: true, title: "Editor's Picks", max: 4 },
  destinations: {
    enabled: true,
    title: "Explore Destinations",
    description: "Discover stories, guides and inspiration from the places we love.",
    slugs: [],
  },
  latest: { enabled: true, title: "Latest Stories", count: 6 },
  stays: {
    enabled: true,
    title: "Handpicked stays for every kind of traveller.",
    slugs: [],
    ctaHref: "/villas",
  },
  experiences: {
    enabled: true,
    title: "Curated experiences that connect you to Goa.",
    slugs: [],
    ctaHref: "/experiences",
  },
  instagram: {
    enabled: true,
    handle: "@earthystays",
    url: "https://instagram.com/earthystays",
    images: [],
  },
  newsletter: {
    enabled: true,
    title: "Travel more. Worry less.",
    description:
      "Subscribe to get our best travel stories, guides and offers straight to your inbox.",
  },
  categoriesEnabled: true,
  order: DEFAULT_ORDER,
};

/** Deep-merge stored overrides onto the defaults so new fields always exist. */
function merge(stored: Partial<JournalHomepage> | null): JournalHomepage {
  if (!stored) return DEFAULT_HOMEPAGE;
  return {
    hero: { ...DEFAULT_HOMEPAGE.hero, ...stored.hero },
    editorsPicks: { ...DEFAULT_HOMEPAGE.editorsPicks, ...stored.editorsPicks },
    destinations: { ...DEFAULT_HOMEPAGE.destinations, ...stored.destinations },
    latest: { ...DEFAULT_HOMEPAGE.latest, ...stored.latest },
    stays: { ...DEFAULT_HOMEPAGE.stays, ...stored.stays },
    experiences: { ...DEFAULT_HOMEPAGE.experiences, ...stored.experiences },
    instagram: { ...DEFAULT_HOMEPAGE.instagram, ...stored.instagram },
    newsletter: { ...DEFAULT_HOMEPAGE.newsletter, ...stored.newsletter },
    categoriesEnabled:
      stored.categoriesEnabled ?? DEFAULT_HOMEPAGE.categoriesEnabled,
    order:
      stored.order && stored.order.length
        ? stored.order
        : DEFAULT_HOMEPAGE.order,
  };
}

export function getHomepage(): JournalHomepage {
  return merge(readJsonSync<JournalHomepage | null>(FILE, null));
}

export async function readHomepage(): Promise<JournalHomepage> {
  return merge(await readJson<JournalHomepage | null>(FILE, null));
}

export async function saveHomepage(cfg: JournalHomepage): Promise<void> {
  await writeJson(FILE, cfg);
}
