"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import type { JournalStatus } from "@/lib/journal/types";
import {
  setArticleStatus,
  duplicateArticle,
  deleteArticle,
} from "../actions";

export function ArticleRowActions({
  id,
  slug,
  status,
}: {
  id: string;
  slug: string;
  status: JournalStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean }>, msg: string) => {
    setOpen(false);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(msg);
        router.refresh();
      } else {
        toast.error("Action failed");
      }
    });
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={pending}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50"
        aria-label="Actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-border bg-popover py-1 text-sm shadow-lg">
          <a href={`/admin/journal/articles/${id}`} className="block px-3 py-2 hover:bg-muted">Edit</a>
          <a href={`/journal/${slug}`} target="_blank" rel="noreferrer" className="block px-3 py-2 hover:bg-muted">Preview ↗</a>
          {status !== "published" && (
            <button type="button" onMouseDown={() => run(() => setArticleStatus(id, "published"), "Published")} className="block w-full px-3 py-2 text-left hover:bg-muted">Publish</button>
          )}
          {status === "published" && (
            <button type="button" onMouseDown={() => run(() => setArticleStatus(id, "draft"), "Unpublished")} className="block w-full px-3 py-2 text-left hover:bg-muted">Unpublish</button>
          )}
          <button type="button" onMouseDown={() => run(() => duplicateArticle(id), "Duplicated")} className="block w-full px-3 py-2 text-left hover:bg-muted">Duplicate</button>
          {status !== "archived" && (
            <button type="button" onMouseDown={() => run(() => setArticleStatus(id, "archived"), "Archived")} className="block w-full px-3 py-2 text-left hover:bg-muted">Archive</button>
          )}
          <button
            type="button"
            onMouseDown={() => {
              if (confirm("Delete this article permanently?")) run(() => deleteArticle(id), "Deleted");
            }}
            className="block w-full px-3 py-2 text-left text-destructive hover:bg-destructive/10"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
