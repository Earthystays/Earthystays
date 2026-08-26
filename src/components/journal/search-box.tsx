"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    next.delete("page");
    router.push(`/journal/search?${next.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search stories, guides, destinations…"
        className="w-full rounded-full border border-border bg-background py-3.5 pl-12 pr-28 text-base outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-forest px-5 py-2 text-sm font-medium text-white hover:bg-forest-deep"
      >
        Search
      </button>
    </form>
  );
}

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "newest";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    next.set("sort", e.target.value);
    next.delete("page");
    router.push(`/journal/search?${next.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={onChange}
      aria-label="Sort stories"
      className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-forest"
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="popular">Most read</option>
    </select>
  );
}
