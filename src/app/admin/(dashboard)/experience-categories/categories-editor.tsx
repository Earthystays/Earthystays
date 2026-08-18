"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ExperienceCategory } from "@/lib/types";
import { saveCategoryList } from "./actions";

export function CategoriesAdmin({ initial }: { initial: ExperienceCategory[] }) {
  const [rows, setRows] = useState<ExperienceCategory[]>(initial);
  const [pending, start] = useTransition();

  const upd = (i: number, patch: Partial<ExperienceCategory>) =>
    setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  function save() {
    start(async () => {
      const res = await saveCategoryList(rows);
      if (res.ok) toast.success("Categories saved");
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Icon (lucide name)</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((c, i) => (
              <tr key={i}>
                <td className="px-4 py-2">
                  <Input value={c.name} onChange={(e) => upd(i, { name: e.target.value })} />
                </td>
                <td className="px-4 py-2">
                  <Input value={c.slug} onChange={(e) => upd(i, { slug: e.target.value })} placeholder="auto from name" />
                </td>
                <td className="px-4 py-2">
                  <Input value={c.icon ?? ""} onChange={(e) => upd(i, { icon: e.target.value })} placeholder="Sparkles" />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, { slug: "", name: "" }])}>
          <Plus className="mr-1 h-4 w-4" /> Add category
        </Button>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
