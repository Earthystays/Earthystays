"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";

/** Rows shown per page. */
const PAGE_SIZE = 20;

/**
 * Owns both the live search and the pagination for the inquiry table.
 *
 * These have to live in one place: search filters by toggling row
 * visibility, so paginating on the server would mean search only ever
 * looked at the current page. Here the server renders every row (72 rows
 * of small markup is cheap) and this component decides which are visible
 * — so a search spans the whole list and pages through its own results.
 *
 * The search box renders inline in the header; the pager is portalled into
 * #inquiry-pager below the table so one component still owns the state.
 */
export function InquirySearch() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [matchCount, setMatchCount] = useState(0);
  const [pagerHost, setPagerHost] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPagerHost(document.getElementById("inquiry-pager"));
  }, []);

  // Re-filter and re-paginate whenever the query or page changes.
  useEffect(() => {
    const rows = Array.from(
      document.querySelectorAll<HTMLElement>("[data-search]"),
    );
    const empty = document.getElementById("inquiry-search-empty");
    const q = query.trim().toLowerCase();

    const matching = q
      ? rows.filter((r) => (r.dataset.search ?? "").includes(q))
      : rows;

    const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
    const current = Math.min(page, pageCount);
    const start = (current - 1) * PAGE_SIZE;
    const visible = new Set(matching.slice(start, start + PAGE_SIZE));

    rows.forEach((r) => {
      r.style.display = visible.has(r) ? "" : "none";
    });

    setMatchCount(matching.length);
    if (empty) empty.hidden = matching.length > 0;
    // Clamp if the active page fell past the end (e.g. after a search).
    if (current !== page) setPage(current);
  }, [query, page]);

  // "/" focuses search from anywhere on the page.
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

  const pageCount = Math.max(1, Math.ceil(matchCount / PAGE_SIZE));
  const from = matchCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, matchCount);

  return (
    <>
      <div className="relative flex-1 sm:min-w-[280px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A8072]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by guest, property, phone…"
          aria-label="Search inquiries"
          className="w-full rounded-full border border-[hsl(38_18%_88%)] bg-white py-2 pr-8 text-xs text-[#2A2A2A] placeholder:text-[#8A8072] focus:border-[#5D7050] focus:outline-none focus:ring-1 focus:ring-[#5D7050]/30"
          style={{ paddingLeft: "2.1rem" }}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setPage(1);
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
      </div>

      {pagerHost &&
        matchCount > 0 &&
        createPortal(
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(38_18%_92%)] px-4 py-3">
            <p className="admin-numeric text-[11px] text-[#8A8072]">
              Showing {from}–{to} of {matchCount}
              {query && " matching"}
            </p>
            {pageCount > 1 && (
              <nav
                className="flex items-center gap-1"
                aria-label="Inquiry pages"
              >
                <PagerButton
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </PagerButton>
                {pageNumbers(page, pageCount).map((n, i) =>
                  n === "gap" ? (
                    <span
                      key={`gap-${i}`}
                      className="px-1 text-[11px] text-[#C4BCAD]"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      aria-current={n === page ? "page" : undefined}
                      className={`admin-numeric grid h-7 min-w-7 place-items-center rounded-full px-2 text-[11px] transition-colors ${
                        n === page
                          ? "bg-[#2A2A2A] text-white"
                          : "text-[#4A4235] hover:bg-[hsl(38_30%_93%)]"
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
                <PagerButton
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </PagerButton>
              </nav>
            )}
          </div>,
          pagerHost,
        )}
    </>
  );
}

function PagerButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-full text-[#4A4235] transition-colors hover:bg-[hsl(38_30%_93%)] disabled:cursor-not-allowed disabled:text-[#D5CEC2] disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

/** First, last, and a window around the current page; gaps become "…". */
function pageNumbers(page: number, total: number): (number | "gap")[] {
  if (total <= 7)
    return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(total - 1, page + 1);
  if (from > 2) out.push("gap");
  for (let n = from; n <= to; n++) out.push(n);
  if (to < total - 1) out.push("gap");
  out.push(total);
  return out;
}
