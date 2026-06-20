import { readJsonSync } from "@/lib/storage";
import { parseVideoUrl, type ParsedVideo } from "@/lib/video";

export type BrandVideoConfig = {
  /** Empty string disables the section entirely. */
  url?: string;
  /** Optional title displayed alongside the embed for screen readers. */
  title?: string;
};

const DEFAULTS: BrandVideoConfig = { url: "", title: "" };

export function getBrandVideoConfig(): BrandVideoConfig {
  return readJsonSync<BrandVideoConfig>("brand-video.json", DEFAULTS);
}

/** Resolved video shape ready for the section to render. Null when the
 *  admin hasn't set a URL — the section then doesn't render. */
export function getBrandVideo(): { video: ParsedVideo; title: string } | null {
  const cfg = getBrandVideoConfig();
  if (!cfg.url) return null;
  const parsed = parseVideoUrl(cfg.url);
  if (!parsed) return null;
  return { video: parsed, title: cfg.title || "Earthy Stays" };
}
