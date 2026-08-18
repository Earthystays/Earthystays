"use client";

import { useEffect } from "react";

const DEDUPE_MS = 30 * 60 * 1000;

/** Fires once per session per experience to record a view for the light
 *  popularity sort + admin analytics. Mirrors VillaViewTracker. */
export function ExperienceViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `experience-view:${slug}`;
    try {
      const last = localStorage.getItem(key);
      if (last && Date.now() - Number(last) < DEDUPE_MS) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {
      // ignore storage failures
    }
    fetch("/api/experience-views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);
  return null;
}
