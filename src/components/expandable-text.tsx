"use client";

import { useState } from "react";

export function ExpandableText({
  text,
  lines = 4,
}: {
  text: string;
  lines?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  // Tailwind only supports line-clamp-1..6 out of the box; fall back to arbitrary
  const clampClass =
    lines === 1
      ? "line-clamp-1"
      : lines === 2
      ? "line-clamp-2"
      : lines === 3
      ? "line-clamp-3"
      : lines === 4
      ? "line-clamp-4"
      : lines === 5
      ? "line-clamp-5"
      : "line-clamp-6";

  return (
    <div>
      <p
        className={`whitespace-pre-line text-muted-foreground leading-relaxed ${
          expanded ? "" : clampClass
        }`}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 inline-block text-sm font-medium text-terracotta underline underline-offset-2 hover:text-terracotta/80"
      >
        {expanded ? "Read less" : "Read more"}
      </button>
    </div>
  );
}
