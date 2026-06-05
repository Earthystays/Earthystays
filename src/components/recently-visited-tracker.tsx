"use client";

import { useEffect } from "react";

const KEY = "earthystays:recent";
const MAX = 12;

type Entry = { slug: string; ts: number };

/**
 * Drop on a villa detail page. Records the slug to localStorage so the
 * home page's "Properties recently visited" carousel can replay it.
 * No network calls — purely a personal client-side list.
 */
export function RecentlyVisitedTracker({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const list: Entry[] = raw ? JSON.parse(raw) : [];
      const without = list.filter((x) => x.slug !== slug);
      without.unshift({ slug, ts: Date.now() });
      localStorage.setItem(KEY, JSON.stringify(without.slice(0, MAX)));
    } catch {
      // localStorage may be unavailable (private mode, blocked cookies, etc.) — silent fallback
    }
  }, [slug]);
  return null;
}
