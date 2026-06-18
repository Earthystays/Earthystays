"use client";

import { useEffect } from "react";

/** Per-session dedupe window — opening the same villa within 30 minutes
 *  only counts once, so a guest who refreshes the page doesn't inflate
 *  the score. */
const DEDUPE_MS = 30 * 60 * 1000;

/**
 * Fires once per session per villa to record a view. Stored as a tiny
 * localStorage flag so the visitor doesn't double-count themselves.
 * Server-side this writes to data/villa-views.json (see /api/villa-views).
 */
export function VillaViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `villa-view:${slug}`;
    try {
      const last = localStorage.getItem(key);
      if (last && Date.now() - Number(last) < DEDUPE_MS) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {
      // private mode / disabled storage — still attempt the ping
    }
    fetch("/api/villa-views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {
      // best-effort: a failed ping doesn't break the page
    });
  }, [slug]);
  return null;
}
