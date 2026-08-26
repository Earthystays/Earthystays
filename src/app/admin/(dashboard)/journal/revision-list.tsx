"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { History, RotateCcw } from "lucide-react";
import { restoreRevision } from "./actions";

type Row = {
  id: string;
  version: number;
  updatedAt: string;
  updatedBy?: string;
  note?: string;
};

export function RevisionList({ revisions }: { revisions: Row[] }) {
  const [pending, start] = useTransition();

  function restore(id: string) {
    if (!confirm("Restore this version? The current content will be saved as a new revision first.")) return;
    start(async () => {
      const res = await restoreRevision(id);
      if (res.ok) toast.success("Version restored");
      else toast.error(res.error ?? "Could not restore");
    });
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {revisions.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
          <div className="flex items-center gap-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Version {r.version}{r.note ? ` · ${r.note}` : ""}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.updatedAt).toLocaleString("en-IN")}
                {r.updatedBy ? ` · ${r.updatedBy}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => restore(r.id)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restore
          </button>
        </li>
      ))}
    </ul>
  );
}
