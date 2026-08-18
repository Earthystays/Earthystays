"use client";

import { useState } from "react";

/** Derived to-dos for today. Check state is visual only (per session) —
 *  the underlying items clear themselves as the host acts on them. */
export function TasksChecklist({ tasks }: { tasks: string[] }) {
  const [done, setDone] = useState<Set<number>>(new Set());

  if (tasks.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">All clear — nothing waiting on you today.</p>;
  }

  return (
    <ul className="mt-3 space-y-2.5">
      {tasks.map((t, i) => {
        const checked = done.has(i);
        return (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  setDone((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
                className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--primary)]"
              />
              <span className={`text-sm ${checked ? "text-muted-foreground line-through" : ""}`}>{t}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
