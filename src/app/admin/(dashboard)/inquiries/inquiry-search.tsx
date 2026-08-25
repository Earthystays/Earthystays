"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

/**
 * Live client-side search over the already-rendered inquiry rows.
 *
 * The server renders every row with a `data-search` attribute holding a
 * lowercased haystack (guest, phone, email, property). This component just
 * toggles row visibility so filtering feels instant — no round-trip, no
 * URL change, and the server-driven detail panel keeps working.
 */
export function InquirySearch() {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const rows = Array.from(
      document.querySelectorAll<HTMLElement>("[data-search]"),
    );
    const empty = document.getElementById("inquiry-search-empty");
    const q = query.trim().toLowerCase();

    if (!q) {
      rows.forEach((r) => (r.style.display = ""));
      if (empty) empty.hidden = true;
      setMatches(null);
      return;
    }

    let count = 0;
    rows.forEach((r) => {
      const hit = (r.dataset.search ?? "").includes(q);
      r.style.display = hit ? "" : "none";
      if (hit) count++;
    });
    setMatches(count);
    if (empty) empty.hidden = count > 0;
  }, [query]);

  // Keyboard shortcut: "/" focuses search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(
          (e.target as HTMLElement)?.tagName ?? "",
        )
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex-1 sm:min-w-[280px]">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A8072]" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by guest, property, phone…"
        aria-label="Search inquiries"
        className="w-full rounded-full border border-[hsl(38_18%_88%)] bg-white py-2 pl-8.5 pr-8 text-xs text-[#2A2A2A] placeholder:text-[#8A8072] focus:border-[#5D7050] focus:outline-none focus:ring-1 focus:ring-[#5D7050]/30"
        style={{ paddingLeft: "2.1rem" }}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-[#8A8072] hover:bg-[hsl(38_30%_93%)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[hsl(38_18%_88%)] bg-[hsl(38_30%_97%)] px-1.5 py-0.5 text-[9px] font-medium text-[#8A8072]">
          /
        </kbd>
      )}
      {matches !== null && (
        <span className="pointer-events-none absolute -bottom-5 left-3 text-[10px] text-[#8A8072]">
          {matches} match{matches === 1 ? "" : "es"}
        </span>
      )}
    </div>
  );
}
