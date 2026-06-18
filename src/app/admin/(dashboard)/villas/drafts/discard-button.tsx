"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { discardDraft } from "../new/actions";

export function DiscardDraftButton({
  draftId,
  label,
}: {
  draftId: string;
  label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Discard "${label}"? This can't be undone.`)) return;
        start(async () => {
          const res = await discardDraft(draftId);
          if (res.ok) toast.success("Draft discarded");
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" /> Discard
    </button>
  );
}
