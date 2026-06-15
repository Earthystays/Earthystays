"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, MapPin, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadButton } from "@/components/image-upload-button";
import type { Destination } from "@/lib/types";
import { addState, addCity, deleteState, deleteCity } from "./actions";

type Props = {
  destinations: Destination[];
};

export function LocationCrud({ destinations }: Props) {
  const [showStateForm, setShowStateForm] = useState(false);
  const [showCityForm, setShowCityForm] = useState(false);

  return (
    <section className="mt-10 border-t border-border/60 pt-10">
      <header>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Add or remove locations
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new state or city to your collection. Removing a location hides
          it everywhere on the public site — guests won&apos;t see it in the
          header dropdown, on the locations page, or in any villa form.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setShowStateForm((v) => !v);
            setShowCityForm(false);
          }}
          variant="outline"
          className="rounded-full"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {showStateForm ? "Cancel" : "Add a state"}
        </Button>
        <Button
          onClick={() => {
            setShowCityForm((v) => !v);
            setShowStateForm(false);
          }}
          variant="outline"
          className="rounded-full"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {showCityForm ? "Cancel" : "Add a city"}
        </Button>
      </div>

      {showStateForm && (
        <AddStateForm onSaved={() => setShowStateForm(false)} />
      )}
      {showCityForm && (
        <AddCityForm
          destinations={destinations}
          onSaved={() => setShowCityForm(false)}
        />
      )}

      {/* Current locations list with delete buttons */}
      <div className="mt-10 grid gap-4">
        <h3 className="font-display text-lg font-semibold">
          Current locations
        </h3>
        {destinations.map((state) => (
          <StateRow key={state.slug} state={state} />
        ))}
      </div>
    </section>
  );
}

function StateRow({ state }: { state: Destination }) {
  const [pending, start] = useTransition();
  function onDelete() {
    if (
      !confirm(
        `Delete "${state.name}"? All villas tagged to this state will lose their location link (but stay listed).`,
      )
    )
      return;
    start(async () => {
      const res = await deleteState(state.slug);
      if (res.ok) toast.success(`Removed ${state.name}`);
      else toast.error("Could not remove");
    });
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">
            {state.name}{" "}
            <span className="text-xs text-muted-foreground">
              · {state.region}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {state.cities.length}{" "}
            {state.cities.length === 1 ? "city" : "cities"}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
          Remove state
        </button>
      </div>

      {state.cities.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {state.cities.map((c) => (
            <CityRow key={c.slug} stateSlug={state.slug} city={c} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CityRow({
  stateSlug,
  city,
}: {
  stateSlug: string;
  city: Destination["cities"][number];
}) {
  const [pending, start] = useTransition();
  function onDelete() {
    if (!confirm(`Delete "${city.name}"?`)) return;
    start(async () => {
      const res = await deleteCity(stateSlug, city.slug);
      if (res.ok) toast.success(`Removed ${city.name}`);
      else toast.error("Could not remove");
    });
  }
  return (
    <li className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-1.5">
        <MapPin className="h-3 w-3 text-terracotta" />
        {city.name}
      </span>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label={`Remove ${city.name}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </li>
  );
}

function AddStateForm({ onSaved }: { onSaved: () => void }) {
  const [imageSrc, setImageSrc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("imageSrc", imageSrc);
    start(async () => {
      const res = await addState(fd);
      if (res.ok) {
        toast.success("State added");
        onSaved();
      } else {
        toast.error(res.error ?? "Could not add state");
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <h3 className="font-display text-lg font-bold tracking-tight">
        Add a new state
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="State name *" name="name" placeholder="Kerala" required />
        <FormField
          label="Region *"
          name="region"
          placeholder="South India"
          required
        />
      </div>

      <FormField
        label="Short blurb"
        name="blurb"
        placeholder="Backwaters, coffee estates, coastal calm."
      />

      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Description (longer)
        </Label>
        <Textarea
          name="description"
          rows={3}
          placeholder="What guests should know about staying here…"
        />
      </div>

      <CoverImageField
        src={imageSrc}
        uploading={uploading}
        onUploadStart={() => setUploading(true)}
        onUploaded={(url) => {
          setUploading(false);
          setImageSrc(url);
        }}
        onRemove={() => setImageSrc("")}
      />

      <Button type="submit" disabled={pending} className="rounded-md">
        {pending ? "Adding…" : "Add state"}
      </Button>
    </form>
  );
}

function AddCityForm({
  destinations,
  onSaved,
}: {
  destinations: Destination[];
  onSaved: () => void;
}) {
  const [imageSrc, setImageSrc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("imageSrc", imageSrc);
    start(async () => {
      const res = await addCity(fd);
      if (res.ok) {
        toast.success("City added");
        onSaved();
      } else {
        toast.error(res.error ?? "Could not add city");
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <h3 className="font-display text-lg font-bold tracking-tight">
        Add a new city
      </h3>

      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          State *
        </Label>
        <select
          name="stateSlug"
          required
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            Choose a state…
          </option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="City name *" name="name" placeholder="Candolim" required />
        <FormField
          label="Short blurb"
          name="blurb"
          placeholder="Quieter cousin of Calangute."
        />
      </div>

      <CoverImageField
        src={imageSrc}
        uploading={uploading}
        onUploadStart={() => setUploading(true)}
        onUploaded={(url) => {
          setUploading(false);
          setImageSrc(url);
        }}
        onRemove={() => setImageSrc("")}
      />

      <Button type="submit" disabled={pending} className="rounded-md">
        {pending ? "Adding…" : "Add city"}
      </Button>
    </form>
  );
}

function FormField({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input name={name} placeholder={placeholder} required={required} />
    </div>
  );
}

function CoverImageField({
  src,
  uploading,
  onUploadStart,
  onUploaded,
  onRemove,
}: {
  src: string;
  uploading: boolean;
  onUploadStart: () => void;
  onUploaded: (url: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        Cover image *
      </Label>
      {src ? (
        <div className="overflow-hidden rounded-lg border border-border/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
          <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-card px-3 py-2">
            <span className="truncate text-xs text-muted-foreground">
              {src.split("/").pop()}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-destructive hover:underline"
            >
              Remove
            </button>
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
              onUploadStart={onUploadStart}
              onUploaded={(url) => onUploaded(url)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
