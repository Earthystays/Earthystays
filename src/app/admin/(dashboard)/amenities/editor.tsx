"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IconPicker } from "@/components/icon-picker";
import { getIconByName } from "@/lib/amenity-catalog";
import { addAmenity, removeAmenity } from "./actions";
import type { StoredAmenity, AmenityKind } from "@/lib/data/amenities-store";

export function AmenitiesEditor({
  initial,
  seedAmenities,
  seedFacilities,
}: {
  initial: StoredAmenity[];
  seedAmenities: string[];
  seedFacilities: string[];
}) {
  const [tab, setTab] = useState<AmenityKind>("amenity");
  const items = initial.filter((i) => i.kind === tab);
  const seedNames = tab === "amenity" ? seedAmenities : seedFacilities;

  return (
    <div>
      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border">
        <TabButton active={tab === "amenity"} onClick={() => setTab("amenity")}>
          Amenities
        </TabButton>
        <TabButton active={tab === "facility"} onClick={() => setTab("facility")}>
          Facilities
        </TabButton>
      </div>

      {/* Add form */}
      <AddForm kind={tab} />

      {/* Seed (read-only) + custom (deletable) lists */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Block
          title="Bundled defaults"
          hint="Always available. Use the picker above to add more."
        >
          <ChipList
            items={seedNames.map((name) => ({ name, icon: undefined }))}
            kind={tab}
            removable={false}
          />
        </Block>

        <Block
          title="Custom (admin-added)"
          hint={
            items.length === 0
              ? "Nothing added yet. Use the form above."
              : `${items.length} custom ${tab === "amenity" ? "amenity" : "facility"}${items.length === 1 ? "" : "s"}.`
          }
        >
          <ChipList
            items={items.map((i) => ({ name: i.name, icon: i.icon }))}
            kind={tab}
            removable
          />
        </Block>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-5 py-3 text-sm font-medium transition-colors ${
        active
          ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-t-full after:bg-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function AddForm({ kind }: { kind: AmenityKind }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    start(async () => {
      const res = await addAmenity(name, icon, kind);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to add");
        return;
      }
      toast.success(`Added ${name}`);
      setName("");
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <h2 className="font-display text-lg font-bold tracking-tight">
        Add a {kind === "amenity" ? "amenity" : "facility"}
      </h2>
      <div className="grid gap-1.5">
        <Label
          htmlFor="amenity-name"
          className="text-xs uppercase tracking-wider text-muted-foreground"
        >
          Name
        </Label>
        <Input
          id="amenity-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            kind === "amenity" ? "Espresso Machine, Yoga Deck…" : "EV Charging, Helipad…"
          }
        />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Icon
        </Label>
        <IconPicker value={icon} onChange={setIcon} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Picked: <span className="font-medium text-foreground">{icon}</span>
        </p>
        <Button type="submit" disabled={pending} className="rounded-md">
          {pending ? "Adding…" : (
            <>
              <Plus className="h-4 w-4 mr-1.5" />
              Add {kind === "amenity" ? "amenity" : "facility"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Block({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
        {title}
      </h3>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ChipList({
  items,
  kind,
  removable,
}: {
  items: Array<{ name: string; icon?: string }>;
  kind: AmenityKind;
  removable: boolean;
}) {
  const [pending, start] = useTransition();

  function onRemove(name: string) {
    if (!confirm(`Remove "${name}"?`)) return;
    start(async () => {
      const res = await removeAmenity(name, kind);
      if (!res.ok) {
        toast.error(res.error ?? "Could not remove");
        return;
      }
      toast.success(`Removed ${name}`);
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Nothing here yet.</p>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = getIconByName(item.icon);
        return (
          <li
            key={item.name}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2"
          >
            <span className="flex items-center gap-2 text-sm text-foreground">
              <Icon className="h-4 w-4 text-terracotta" strokeWidth={1.6} />
              {item.name}
            </span>
            {removable && (
              <button
                type="button"
                onClick={() => onRemove(item.name)}
                disabled={pending}
                aria-label={`Remove ${item.name}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
