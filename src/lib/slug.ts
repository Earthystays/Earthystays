/** URL-safe slug from any human-readable string. */
export function slugify(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
