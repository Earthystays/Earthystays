"use client";

import { useEffect } from "react";

/** Records a view on mount, then delegates clicks on any embedded property /
 *  experience / booking link inside the article to a tracking beacon. This is
 *  the attribution backbone (spec §37): article → property click → booking. */
export function ArticleTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const beacon = (event: string, extra: Record<string, string> = {}) => {
      const body = JSON.stringify({ slug, event, ...extra });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/journal/track",
          new Blob([body], { type: "application/json" }),
        );
      } else {
        fetch("/api/journal/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };

    // One view per session per article.
    const key = `journal-viewed-${slug}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      beacon("view");
    }

    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest(
        "[data-track-property],[data-track-experience]",
      ) as HTMLElement | null;
      if (!target) return;
      const prop = target.getAttribute("data-track-property");
      const exp = target.getAttribute("data-track-experience");
      if (prop) beacon("property_click", { ref: prop });
      else if (exp) beacon("experience_click", { ref: exp });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [slug]);

  return null;
}
