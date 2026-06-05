"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type FaqItem = { question: string; answer: string };

export function FaqEditor({
  name,
  initial = [],
}: {
  name: string; // hidden field name (JSON serialized array)
  initial?: FaqItem[];
}) {
  const [items, setItems] = useState<FaqItem[]>(initial);

  function add() {
    setItems((s) => [...s, { question: "", answer: "" }]);
  }
  function remove(i: number) {
    setItems((s) => s.filter((_, idx) => idx !== i));
  }
  function patch(i: number, key: keyof FaqItem, value: string) {
    setItems((s) => s.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  }

  return (
    <div className="grid gap-4">
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(items.filter((i) => i.question.trim() || i.answer.trim()))}
      />

      {items.length === 0 && (
        <p className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          No custom FAQs yet. Smart defaults (check-in time, pet policy, meals, how to book…)
          will be used on the villa detail page. Add your own below to override them.
        </p>
      )}

      <ul className="grid gap-3">
        {items.map((it, i) => (
          <li
            key={i}
            className="grid gap-2 rounded-lg border border-border/60 bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                FAQ {i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
            <Input
              value={it.question}
              onChange={(e) => patch(i, "question", e.target.value)}
              placeholder="Question — e.g. Is the pool heated?"
            />
            <Textarea
              value={it.answer}
              onChange={(e) => patch(i, "answer", e.target.value)}
              rows={3}
              placeholder="Answer in plain English. Markdown not supported."
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={add}
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:bg-muted"
      >
        <Plus className="h-3.5 w-3.5" />
        {items.length === 0 ? "Add a FAQ" : "Add another FAQ"}
      </button>
    </div>
  );
}
