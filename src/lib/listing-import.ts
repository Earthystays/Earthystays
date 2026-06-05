/**
 * Listing importer — Path A (free, OG-based, partial fill).
 *
 * Fetches the URL like a browser, scrapes Open Graph meta tags + any
 * JSON-LD blocks, and returns whatever it could find. No third-party
 * service — purely Node's built-in fetch.
 *
 * Reliable for: Booking.com (mostly), direct hotel sites, Vrbo (sometimes).
 * Unreliable for: Airbnb (Cloudflare-protected), Agoda (anti-bot).
 *
 * When a platform blocks us, we still capture the URL itself so the admin
 * can save the villa with the listing attached and fill in everything by
 * hand.
 */

import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

const PLATFORM_HOSTS: Record<string, string> = {
  "airbnb.com": "Airbnb",
  "airbnb.co.in": "Airbnb",
  "booking.com": "Booking.com",
  "vrbo.com": "Vrbo",
  "agoda.com": "Agoda",
  "tripadvisor.com": "TripAdvisor",
  "tripadvisor.in": "TripAdvisor",
  "expedia.com": "Expedia",
  "expedia.co.in": "Expedia",
  "makemytrip.com": "MakeMyTrip",
  "goibibo.com": "Goibibo",
  "stayvista.com": "StayVista",
  "saffronstays.com": "SaffronStays",
};

export type ImportedListing = {
  platform: string;
  url: string;
  name?: string;
  description?: string;
  imageUrls: string[];
  rating?: number;
  reviewCount?: number;
  city?: string;
  state?: string;
};

export function platformFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (PLATFORM_HOSTS[host]) return PLATFORM_HOSTS[host];
    // Fallback: capitalize the base domain
    const base = host.split(".")[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return "External";
  }
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'");
}

function extractMeta(html: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`,
      "i",
    ),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1]) return decodeHtmlEntities(m[1].trim());
  }
  return undefined;
}

type JsonLd = Record<string, unknown> & {
  name?: string;
  description?: string;
  image?: string | string[] | { url?: string }[];
  aggregateRating?: { ratingValue?: string | number; reviewCount?: string | number; ratingCount?: string | number };
  address?: { addressLocality?: string; addressRegion?: string };
};

function extractJsonLd(html: string): JsonLd[] {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const results: JsonLd[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1]) as JsonLd | JsonLd[];
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }
  return results;
}

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

export async function importListingFromUrl(
  url: string,
): Promise<{ ok: true; data: ImportedListing } | { ok: false; error: string }> {
  // Basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return { ok: false, error: "Only http(s) URLs are supported." };
  }

  let res: Response;
  try {
    res = await fetch(url, { headers: BROWSER_HEADERS, redirect: "follow" });
  } catch (err) {
    return {
      ok: false,
      error: `Could not reach that URL — ${err instanceof Error ? err.message : "network error"}.`,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: `The page returned HTTP ${res.status}. The platform may be blocking automated requests — fill in the form by hand.`,
    };
  }

  const html = await res.text();
  const platform = platformFromUrl(url);

  const data: ImportedListing = {
    platform,
    url,
    imageUrls: [],
  };

  // 1) Open Graph meta tags (most reliable)
  const ogTitle = extractMeta(html, "og:title") ?? extractMeta(html, "twitter:title");
  const ogDesc =
    extractMeta(html, "og:description") ?? extractMeta(html, "twitter:description") ?? extractMeta(html, "description");
  const ogImage = extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");

  if (ogTitle) {
    // Trim platform/region suffixes like "… - Villas for Rent in Goa - Airbnb"
    data.name = ogTitle.split(/[·|—–]| - /)[0].trim().slice(0, 120);
  }
  if (ogDesc) data.description = ogDesc.slice(0, 2000);
  if (ogImage) data.imageUrls.push(ogImage);

  // 2) JSON-LD (richer when present)
  for (const ld of extractJsonLd(html)) {
    if (!ld || typeof ld !== "object") continue;
    if (typeof ld.name === "string" && !data.name) data.name = ld.name.slice(0, 120);
    if (typeof ld.description === "string" && !data.description)
      data.description = ld.description.slice(0, 2000);
    if (ld.image) {
      const imgs = Array.isArray(ld.image) ? ld.image : [ld.image];
      for (const img of imgs) {
        const src = typeof img === "string" ? img : img?.url;
        if (src && !data.imageUrls.includes(src)) data.imageUrls.push(src);
      }
    }
    if (ld.aggregateRating?.ratingValue) {
      const r = Number(ld.aggregateRating.ratingValue);
      if (Number.isFinite(r)) data.rating = Math.min(5, Math.max(0, r > 5 ? r / 2 : r));
    }
    if (ld.aggregateRating?.reviewCount || ld.aggregateRating?.ratingCount) {
      const n = Number(ld.aggregateRating.reviewCount ?? ld.aggregateRating.ratingCount);
      if (Number.isFinite(n)) data.reviewCount = n;
    }
    if (ld.address?.addressLocality && !data.city)
      data.city = String(ld.address.addressLocality);
    if (ld.address?.addressRegion && !data.state)
      data.state = String(ld.address.addressRegion);
  }

  // Some pages return the challenge page with HTTP 200 — bail if we got literally nothing
  if (!data.name && data.imageUrls.length === 0) {
    return {
      ok: false,
      error: `Could not read any property data from that ${platform} URL. The page may require login or block scraping — please add the property by hand.`,
    };
  }

  return { ok: true, data };
}

/**
 * Try to download a remote image into public/uploads/. Returns the local
 * path (e.g. "/uploads/imported-abc123.jpg") on success, or the original
 * URL as a fallback when the CDN refuses our request.
 *
 * Falling back to the remote URL has a cost: Next/Image won't render it
 * unless the host is whitelisted in next.config.ts remotePatterns.
 */
export async function downloadImageToUploads(
  src: string,
): Promise<{ ok: true; path: string } | { ok: false; src: string }> {
  try {
    const res = await fetch(src, { headers: BROWSER_HEADERS, redirect: "follow" });
    if (!res.ok) return { ok: false, src };
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    const ext =
      ct.includes("png") ? ".png" :
      ct.includes("webp") ? ".webp" :
      ct.includes("avif") ? ".avif" :
      ct.includes("gif") ? ".gif" :
      ".jpg";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 15 * 1024 * 1024) {
      return { ok: false, src }; // skip empty or >15MB
    }
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const name = `imported-${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
    await fs.writeFile(path.join(dir, name), buf);
    return { ok: true, path: `/uploads/${name}` };
  } catch {
    return { ok: false, src };
  }
}

/** Slugify a villa name for use as the URL slug. */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `import-${Date.now().toString(36)}`;
}
