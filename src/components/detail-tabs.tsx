"use client";

import { useEffect, useRef, useState } from "react";

export type DetailTab = { id: string; label: string };

export function DetailTabs({ tabs }: { tabs: DetailTab[] }) {
  const [active, setActive] = useState<string>(tabs[0]?.id ?? "");
  const lockedUntil = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined" || tabs.length === 0) return;
    const sections = tabs
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    function pick() {
      if (Date.now() < lockedUntil.current) return;
      // Choose the section whose top is closest to ~200px below viewport top
      const probe = 220;
      let best: { id: string; dist: number } | null = null;
      for (const s of sections) {
        const top = s.getBoundingClientRect().top;
        const dist = Math.abs(top - probe);
        if (top - probe < 1 && (!best || dist < best.dist)) {
          best = { id: s.id, dist };
        }
      }
      setActive(best?.id ?? tabs[0].id);
    }

    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [tabs]);

  function handleTabClick(id: string, e: React.MouseEvent) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    // Lock scrollspy briefly so the smooth scroll doesn't fight us.
    // Called from a click handler — never during render — so Date.now() is fine here.
    // eslint-disable-next-line react-hooks/purity -- called from event handler, not render
    lockedUntil.current = Date.now() + 700;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  if (tabs.length === 0) return null;

  return (
    <div className="sticky top-20 z-30 border-b border-border bg-background/95 backdrop-blur-md">
      <nav
        aria-label="Villa sections"
        className="container-page flex gap-8 overflow-x-auto text-[15px] sm:gap-10 sm:text-base whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            onClick={(e) => handleTabClick(t.id, e)}
            className={`relative py-5 transition-colors ${
              active === t.id
                ? "text-foreground font-semibold after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-t-full after:bg-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
