"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteVilla } from "./actions";

export function DeleteVillaButton({ slug, name }: { slug: string; name: string }) {
  const [pending, start] = useTransition();

  function onClick() {
    if (!confirm(`Delete "${name}"? This removes it from data/villas.json.`)) return;
    start(async () => {
      await deleteVilla(slug);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1 text-destructive hover:underline disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
