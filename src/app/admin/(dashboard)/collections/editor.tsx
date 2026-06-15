"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadButton } from "@/components/image-upload-button";
import type { Collection } from "@/lib/types";
import {
  addCollection,
  updateCollection,
  deleteCollection,
} from "./actions";

export function CollectionsEditor({ initial }: { initial: Collection[] }) {
  const [editing, setEditing] = useState<Collection | null>(null);
  const [adding, setAdding] = useState(false);

  function close() {
    setAdding(false);
    setEditing(null);
  }

  return (
    <div>
      <div className="mt-6 flex justify-between">
        <p className="text-sm text-muted-foreground">
          {initial.length} {initial.length === 1 ? "collection" : "collections"}.
        </p>
        {!adding && !editing && (
          <Button onClick={() => setAdding(true)} className="rounded-full">
            <Plus className="h-4 w-4 mr-1.5" />
            Add collection
          </Button>
        )}
      </div>

      {adding && <CollectionForm onClose={close} />}
      {editing && <CollectionForm onClose={close} initial={editing} />}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initial.map((c) => (
          <CollectionCard key={c.slug} collection={c} onEdit={() => setEditing(c)} />
        ))}
      </ul>
    </div>
  );
}

function CollectionCard({
  collection,
  onEdit,
}: {
  collection: Collection;
  onEdit: () => void;
}) {
  const [pending, start] = useTransition();
  function onDelete() {
    if (!confirm(`Delete "${collection.name}"?`)) return;
    start(async () => {
      const res = await deleteCollection(collection.slug);
      if (res.ok) toast.success(`Removed ${collection.name}`);
      else toast.error("Could not remove");
    });
  }
  return (
    <li className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="relative aspect-[4/3] bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={collection.image.src}
          alt={collection.image.alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <p className="font-display text-base font-semibold text-foreground">
          {collection.name}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {collection.blurb}
        </p>
        <div className="mt-3 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-terracotta hover:underline"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="inline-flex items-center gap-1 text-destructive hover:underline disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      </div>
    </li>
  );
}

function CollectionForm({
  initial,
  onClose,
}: {
  initial?: Collection;
  onClose: () => void;
}) {
  const [imageSrc, setImageSrc] = useState(initial?.image.src ?? "");
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("imageSrc", imageSrc);
    start(async () => {
      const res = initial
        ? await updateCollection(initial.slug, fd)
        : await addCollection(fd);
      if (res.ok) {
        toast.success(initial ? "Collection updated" : "Collection added");
        onClose();
      } else {
        toast.error(res.error ?? "Could not save");
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight">
          {initial ? `Edit "${initial.name}"` : "Add a collection"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Name *
        </Label>
        <Input
          name="name"
          defaultValue={initial?.name ?? ""}
          placeholder="Pool Villas, Pet Friendly…"
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Blurb
        </Label>
        <Textarea
          name="blurb"
          rows={2}
          defaultValue={initial?.blurb ?? ""}
          placeholder="Short tagline shown under the title."
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Cover image *
        </Label>
        {imageSrc ? (
          <div className="overflow-hidden rounded-lg border border-border/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-card px-3 py-2">
              <span className="truncate text-xs text-muted-foreground">
                {imageSrc.split("/").pop()}
              </span>
              <div className="flex items-center gap-2">
                <ImageUploadButton
                  label="Replace"
                  onUploadStart={() => setUploading(true)}
                  onUploaded={(url) => {
                    setUploading(false);
                    setImageSrc(url);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setImageSrc("")}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
            {uploading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Upload
                className="mx-auto h-5 w-5 text-muted-foreground"
                strokeWidth={1.5}
              />
            )}
            <p className="mt-2 text-sm font-medium">
              {uploading ? "Uploading…" : "Upload a cover image"}
            </p>
            <div className="mt-3">
              <ImageUploadButton
                label="Choose image"
                onUploadStart={() => setUploading(true)}
                onUploaded={(url) => {
                  setUploading(false);
                  setImageSrc(url);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <input type="hidden" name="imageAlt" value={initial?.image.alt ?? ""} />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="rounded-md">
          {pending ? "Saving…" : initial ? "Save changes" : "Add collection"}
        </Button>
      </div>
    </form>
  );
}
