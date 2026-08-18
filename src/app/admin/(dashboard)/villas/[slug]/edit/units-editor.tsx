"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Loader2, BedDouble, Hotel, Users, Ruler, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhotoUploader, type UploadedPhoto } from "@/components/photo-uploader";
import { toast } from "sonner";
import type {
  AccommodationUnit,
  BedInventory,
  DormGender,
  Image as ImageT,
  InventoryUnitStatus,
} from "@/lib/types";
import { generateBeds } from "@/lib/data/units";
import { saveUnit, deleteUnit, toggleUnitDate } from "../../unit-actions";

/** Statuses an operator sets by hand ("held" is transient, set by checkout). */
const BED_STATUSES: { value: InventoryUnitStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "booked", label: "Booked" },
  { value: "blocked", label: "Blocked" },
  { value: "maintenance", label: "Maintenance" },
  { value: "out_of_service", label: "Out of service" },
];

const BED_STATUS_STYLE: Record<string, string> = {
  available: "border-primary/40 bg-primary/5",
  booked: "border-amber-400/50 bg-amber-50 dark:bg-amber-950/30",
  blocked: "border-border bg-muted",
  maintenance: "border-border bg-muted",
  out_of_service: "border-destructive/40 bg-destructive/5",
};

type Kind = "room" | "dorm";

/** Blank unit template for the "add" form. */
function blankUnit(kind: Kind): AccommodationUnit {
  return {
    id: "",
    kind,
    name: "",
    maxGuests: kind === "dorm" ? 1 : 2,
    inventory: kind === "dorm" ? 8 : 4,
    basePrice: kind === "dorm" ? 599 : 4500,
  };
}

const num = (s: string, fallback = 0) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
};

export function UnitsEditor({
  slug,
  type,
  initialUnits,
  initialBlockedDates = {},
}: {
  slug: string;
  type: "hotel" | "hostel";
  initialUnits: AccommodationUnit[];
  /** Per-unit blocked dates: { [unitId]: ["YYYY-MM-DD"] } (Phase H). */
  initialBlockedDates?: Record<string, string[]>;
}) {
  const kind: Kind = type === "hotel" ? "room" : "dorm";
  const nounSingular = type === "hotel" ? "Room type" : "Dorm type";
  const invNoun = type === "hotel" ? "rooms" : "beds";

  const [units, setUnits] = useState<AccommodationUnit[]>(initialUnits);
  const [draft, setDraft] = useState<AccommodationUnit | null>(null);
  const [blocked, setBlocked] = useState<Record<string, string[]>>(initialBlockedDates);
  const [dateToBlock, setDateToBlock] = useState("");
  const [pending, startTransition] = useTransition();

  function onToggleDate(unitId: string, date: string) {
    if (!date) return;
    startTransition(async () => {
      try {
        const res = await toggleUnitDate(slug, unitId, date);
        setBlocked((prev) => ({ ...prev, [unitId]: res.dates }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update dates");
      }
    });
  }

  const set = <K extends keyof AccommodationUnit>(k: K, val: AccommodationUnit[K]) =>
    setDraft((d) => (d ? { ...d, [k]: val } : d));

  const updateBed = (index: number, patch: Partial<BedInventory>) =>
    setDraft((d) => {
      if (!d?.beds) return d;
      const beds = d.beds.map((b, i) => (i === index ? { ...b, ...patch } : b));
      return { ...d, beds };
    });

  function onSave() {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Give this " + nounSingular.toLowerCase() + " a name.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await saveUnit(slug, draft);
        setUnits((prev) => {
          const withId = { ...draft, id: res.unitId };
          const idx = prev.findIndex((u) => u.id === res.unitId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = withId;
            return copy;
          }
          return [...prev, withId];
        });
        setDraft(null);
        toast.success(`${nounSingular} saved`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  function onDelete(unitId: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteUnit(slug, unitId);
        setUnits((prev) => prev.filter((u) => u.id !== unitId));
        toast.success(`${nounSingular} deleted`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not delete");
      }
    });
  }

  const Icon = type === "hotel" ? Hotel : BedDouble;

  return (
    <section className="mt-12 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl">
              {type === "hotel" ? "Room types" : "Dorm types"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Each {nounSingular.toLowerCase()} carries its own price and pooled{" "}
              {invNoun} inventory.
            </p>
          </div>
        </div>
        {!draft && (
          <Button type="button" onClick={() => setDraft(blankUnit(kind))} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add {nounSingular.toLowerCase()}
          </Button>
        )}
      </div>

      {/* Existing units list */}
      {units.length > 0 && (
        <ul className="mt-6 grid gap-3">
          {units.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-background px-4 py-3"
            >
              <div className="min-w-40 flex-1">
                <p className="font-medium">{u.name}</p>
                {u.bedConfiguration && (
                  <p className="text-xs text-muted-foreground">{u.bedConfiguration}</p>
                )}
              </div>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {u.maxGuests}
              </span>
              {u.size && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Ruler className="h-3.5 w-3.5" /> {u.size}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm font-medium">
                <IndianRupee className="h-3.5 w-3.5" />
                {u.basePrice.toLocaleString("en-IN")}
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {u.inventory} {invNoun}
              </span>
              {(blocked[u.id]?.length ?? 0) > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  {blocked[u.id].length} blocked
                </span>
              )}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setDraft(structuredClone(u))}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(u.id, u.name)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {units.length === 0 && !draft && (
        <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No {type === "hotel" ? "room types" : "dorm types"} yet. Add your first
          to start taking inquiries for this {type}.
        </p>
      )}

      {/* Add / edit form */}
      {draft && (
        <div className="mt-6 grid gap-4 rounded-xl border border-primary/30 bg-primary/[0.03] p-5">
          <h3 className="font-medium">
            {draft.id ? `Edit ${draft.name || nounSingular.toLowerCase()}` : `New ${nounSingular.toLowerCase()}`}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <UField label={`${nounSingular} name`}>
              <Input
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={type === "hotel" ? "Deluxe Room" : "8 Bed Mixed Dorm"}
              />
            </UField>
            <UField label="Bed configuration">
              <Input
                value={draft.bedConfiguration ?? ""}
                onChange={(e) => set("bedConfiguration", e.target.value)}
                placeholder={type === "hotel" ? "1 Queen Bed" : "8 Single Beds"}
              />
            </UField>
          </div>

          <UField label="Short description">
            <Input
              value={draft.shortDescription ?? ""}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="One line shown on the room card."
            />
          </UField>
          <UField label="Description">
            <Textarea
              rows={3}
              value={draft.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </UField>

          <div className="grid gap-4 sm:grid-cols-3">
            <UField label="Max guests">
              <Input
                type="number"
                min={1}
                value={draft.maxGuests}
                onChange={(e) => set("maxGuests", num(e.target.value, 1))}
              />
            </UField>
            <UField label="Size">
              <Input
                value={draft.size ?? ""}
                onChange={(e) => set("size", e.target.value)}
                placeholder="250 sq ft"
              />
            </UField>
            <UField label={`Inventory (${invNoun})`} hint="How many can be booked in total">
              <Input
                type="number"
                min={0}
                value={draft.inventory}
                onChange={(e) => set("inventory", num(e.target.value, 0))}
              />
            </UField>
          </div>

          {/* Dorm-only fields */}
          {kind === "dorm" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <UField label="Gender policy">
                <select
                  value={draft.gender ?? "mixed"}
                  onChange={(e) => set("gender", e.target.value as DormGender)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="mixed">Mixed</option>
                  <option value="female">Female only</option>
                  <option value="male">Male only</option>
                </select>
              </UField>
              <UField label="Total beds in dorm">
                <Input
                  type="number"
                  min={1}
                  value={draft.bedCount ?? ""}
                  onChange={(e) => set("bedCount", num(e.target.value, 0) || undefined)}
                  placeholder="8"
                />
              </UField>
            </div>
          )}

          {/* Named bed inventory (hostel) */}
          {kind === "dorm" && (
            <div className="grid gap-3 rounded-lg border border-border bg-background p-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.allowUnitSelection ?? false}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            allowUnitSelection: on,
                            beds:
                              on && (!d.beds || d.beds.length === 0)
                                ? generateBeds(d.bedCount ?? d.inventory, d.beds)
                                : d.beds,
                          }
                        : d,
                    );
                  }}
                  className="h-4 w-4"
                />
                Let guests choose their specific bed
              </label>
              <p className="text-xs text-muted-foreground">
                Off = beds are auto-assigned at check-in. On = guests pick from
                the grid below, and each bed&rsquo;s status controls availability.
              </p>

              {draft.allowUnitSelection && (
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        set("beds", generateBeds(draft.bedCount ?? draft.inventory, draft.beds))
                      }
                    >
                      Sync beds to count ({draft.bedCount ?? draft.inventory})
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {draft.beds?.length ?? 0} beds configured
                    </span>
                  </div>

                  {draft.beds && draft.beds.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {draft.beds.map((bed, i) => (
                        <div
                          key={bed.id}
                          className={`grid gap-2 rounded-lg border p-3 ${
                            BED_STATUS_STYLE[bed.status ?? "available"] ?? ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{bed.label}</span>
                            <select
                              value={bed.position ?? ""}
                              onChange={(e) =>
                                updateBed(i, {
                                  position: (e.target.value || undefined) as
                                    | "upper"
                                    | "lower"
                                    | undefined,
                                })
                              }
                              className="h-7 rounded border border-input bg-transparent px-1.5 text-xs"
                            >
                              <option value="">—</option>
                              <option value="lower">Lower</option>
                              <option value="upper">Upper</option>
                            </select>
                          </div>
                          <select
                            value={bed.status ?? "available"}
                            onChange={(e) =>
                              updateBed(i, {
                                status: e.target.value as InventoryUnitStatus,
                              })
                            }
                            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                          >
                            {BED_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <UField label="Base price / night (₹)">
              <Input
                type="number"
                min={0}
                value={draft.basePrice}
                onChange={(e) => set("basePrice", num(e.target.value, 0))}
              />
            </UField>
            <UField label="Weekend price (₹)">
              <Input
                type="number"
                min={0}
                value={draft.weekendPrice ?? ""}
                onChange={(e) => set("weekendPrice", num(e.target.value, 0) || undefined)}
              />
            </UField>
            <UField label="Tax %">
              <Input
                type="number"
                min={0}
                value={draft.taxPercent ?? ""}
                onChange={(e) => set("taxPercent", num(e.target.value, 0) || undefined)}
                placeholder="12"
              />
            </UField>
          </div>

          <UField label="Photos">
            <PhotoUploader
              name={`unit-photos-${draft.id || "new"}`}
              initial={(draft.images ?? []) as UploadedPhoto[]}
              onChange={(photos) => set("images", photos as ImageT[])}
            />
          </UField>

          {/* Per-unit unavailable dates — only for a saved unit (needs its id) */}
          {draft.id && (
            <div className="grid gap-2 rounded-lg border border-border bg-background p-4">
              <Label className="text-sm">Unavailable dates</Label>
              <p className="text-xs text-muted-foreground">
                Block specific nights for this {nounSingular.toLowerCase()} (e.g.
                maintenance or an offline booking). Saved immediately.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={dateToBlock}
                  onChange={(e) => setDateToBlock(e.target.value)}
                  className="h-9 w-auto"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!dateToBlock || pending}
                  onClick={() => {
                    onToggleDate(draft.id, dateToBlock);
                    setDateToBlock("");
                  }}
                >
                  Block date
                </Button>
              </div>
              {(blocked[draft.id]?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {blocked[draft.id].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onToggleDate(draft.id, d)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs hover:border-destructive hover:text-destructive"
                      title="Click to unblock"
                    >
                      {d} <span aria-hidden>×</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No blocked dates.</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="button" onClick={onSave} disabled={pending} className="gap-1.5">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save {nounSingular.toLowerCase()}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraft(null)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function UField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
