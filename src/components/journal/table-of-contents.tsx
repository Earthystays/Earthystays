"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export type TocItem = { id: string; text: string; level: 2 | 3 };

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  function go(e: React.MouseEvent, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  }

  return (
    <>
      {/* Desktop — sticky sidebar */}
      <nav className="hidden lg:block" aria-label="On this page">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          On this page
        </p>
        <ul className="space-y-2 border-l border-border">
          {items.map((it) => (
            <li key={it.id} className={it.level === 3 ? "pl-3" : ""}>
              <a
                href={`#${it.id}`}
                onClick={(e) => go(e, it.id)}
                className={`-ml-px block border-l-2 pl-3 text-sm leading-snug transition-colors ${
                  active === it.id
                    ? "border-forest font-medium text-forest"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {it.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile — collapsible dropdown */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
        >
          On this page
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <ul className="mt-2 space-y-1 rounded-xl border border-border bg-card p-2">
            {items.map((it) => (
              <li key={it.id}>
                <a
                  href={`#${it.id}`}
                  onClick={(e) => go(e, it.id)}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    it.level === 3 ? "pl-6" : ""
                  } text-muted-foreground hover:bg-muted hover:text-foreground`}
                >
                  {it.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
