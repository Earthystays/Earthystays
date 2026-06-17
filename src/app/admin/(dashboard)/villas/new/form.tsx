"use client";

import { useActionState, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhotoUploader } from "@/components/photo-uploader";
import { VideoInput } from "@/components/video-input";
import { FaqEditor } from "@/components/faq-editor";
import { ExternalListingsEditor } from "@/components/external-listings-editor";
import { AlertTriangle } from "lucide-react";
import { addVilla, type AddVillaState } from "./actions";
import { getIconByName } from "@/lib/amenity-catalog";

type AmenityChoice = { name: string; iconName: string };

const INITIAL: AddVillaState = { ok: false };

type CancellationPreset = { value: string; label: string; description: string };
type MealPreset = { value: string; label: string; description: string };

export function NewVillaForm({
  destinations,
  collections,
  amenities,
  facilities,
  states,
  cancellationPresets,
  mealPresets,
  initialState,
}: {
  destinations: { slug: string; name: string }[];
  collections: { slug: string; name: string }[];
  amenities: AmenityChoice[];
  facilities: AmenityChoice[];
  states: string[];
  cancellationPresets: CancellationPreset[];
  mealPresets: MealPreset[];
  initialState?: AddVillaState;
}) {
  const [state, action, pending] = useActionState(addVilla, initialState ?? INITIAL);
  const v = state.values;

  // Cancellation policy is controlled so the textarea auto-fills from preset
  const [policyPreset, setPolicyPreset] = useState<string>(v?.cancellationPreset ?? "");
  const [policyDescription, setPolicyDescription] = useState<string>(
    v?.cancellationDescription ?? "",
  );

  // Meals — same controlled-preset pattern as cancellation
  const [mealsPreset, setMealsPreset] = useState<string>(v?.mealsPreset ?? "");
  const [mealsDescription, setMealsDescription] = useState<string>(
    v?.mealsDescription ?? "",
  );

  // Restore cancellation + meals state from the server-action snapshot after
  // a validation error. `v` comes from useActionState (external) so the
  // effect is the right place — we need to react when the server hands us
  // new values.
  useEffect(() => {
    if (v) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: restoring state from server action snapshot
      setPolicyPreset(v.cancellationPreset ?? "");
      setPolicyDescription(v.cancellationDescription ?? "");
      setMealsPreset(v.mealsPreset ?? "");
      setMealsDescription(v.mealsDescription ?? "");
    }
  }, [v]);

  function pickPreset(value: string) {
    setPolicyPreset(value);
    const found = cancellationPresets.find((p) => p.value === value);
    if (found && value !== "custom") {
      setPolicyDescription(found.description);
    }
  }

  function pickMealsPreset(value: string) {
    setMealsPreset(value);
    const found = mealPresets.find((p) => p.value === value);
    if (found && value !== "custom") {
      setMealsDescription(found.description);
    }
  }

  return (
    <form action={action} className="mt-10 grid gap-8" key={state.attemptId ?? "initial"}>
      {state.error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" /> {state.error}
          </p>
          {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
            <ul className="mt-2 list-disc pl-7 text-xs">
              {Object.entries(state.fieldErrors).map(([field, msg]) => (
                <li key={field}>
                  <span className="font-medium capitalize">{prettyField(field)}</span>
                  : {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Villa name" error={state.fieldErrors?.name}>
            <Input name="name" required placeholder="Casa Azul" defaultValue={v?.name ?? ""} />
          </Field>
          <Field name="slug" label="Slug (URL)" hint="lowercase, dashes only" error={state.fieldErrors?.slug}>
            <Input
              name="slug"
              required
              placeholder="casa-azul-anjuna"
              pattern="[a-z0-9-]+"
              defaultValue={v?.slug ?? ""}
            />
          </Field>
        </div>
        <Field name="tagline" label="Tagline" error={state.fieldErrors?.tagline}>
          <Input
            name="tagline"
            required
            placeholder="Blue-shuttered Portuguese villa, two minutes from the cove."
            defaultValue={v?.tagline ?? ""}
          />
        </Field>
        <Field name="description" label="Description" hint="Long paragraph for the detail page" error={state.fieldErrors?.description}>
          <Textarea name="description" required rows={5} defaultValue={v?.description ?? ""} />
        </Field>
      </Section>

      <Section title="Capacity & pricing">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field name="bedrooms" label="Bedrooms" error={state.fieldErrors?.bedrooms}>
            <Input name="bedrooms" type="number" min={1} required defaultValue={v?.bedrooms ?? "4"} />
          </Field>
          <Field name="bathrooms" label="Bathrooms" error={state.fieldErrors?.bathrooms}>
            <Input name="bathrooms" type="number" min={1} required defaultValue={v?.bathrooms ?? "4"} />
          </Field>
          <Field name="maxGuests" label="Max guests" error={state.fieldErrors?.maxGuests}>
            <Input name="maxGuests" type="number" min={1} required defaultValue={v?.maxGuests ?? "8"} />
          </Field>
          <Field name="pricePerNight" label="Price/night (₹)" error={state.fieldErrors?.pricePerNight}>
            <Input
              name="pricePerNight"
              type="number"
              min={1000}
              step={1000}
              required
              defaultValue={v?.pricePerNight ?? "35000"}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="rating" label="Rating (0–5)">
            <Input
              name="rating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              defaultValue={v?.rating ?? "4.8"}
            />
          </Field>
          <Field name="reviewCount" label="Review count">
            <Input
              name="reviewCount"
              type="number"
              min={0}
              defaultValue={v?.reviewCount ?? "0"}
            />
          </Field>
        </div>
      </Section>

      <Section title="Location" hint="Lat/long enables a map embed on the detail page">
        <Field name="destinationSlug" label="Destination" error={state.fieldErrors?.destinationSlug}>
          <select
            name="destinationSlug"
            required
            defaultValue={v?.destinationSlug ?? ""}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="" disabled>Choose…</option>
            {destinations.map((d) => (
              <option key={d.slug} value={d.slug}>{d.name}</option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="state" label="State" error={state.fieldErrors?.state}>
            <select
              name="state"
              defaultValue={v?.state ?? ""}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Choose…</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field name="city" label="City" hint="Free text" error={state.fieldErrors?.city}>
            <Input name="city" placeholder="Anjuna" defaultValue={v?.city ?? ""} />
          </Field>
        </div>
        <Field name="locationNote" label="Location note" hint="Shown on detail page (e.g. drive time from airport)" error={state.fieldErrors?.locationNote}>
          <Input
            name="locationNote"
            required
            placeholder="Anjuna, North Goa — 45 min from Dabolim."
            defaultValue={v?.locationNote ?? ""}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="latitude" label="Latitude" hint="-90 to 90 (e.g. 15.5762345)">
            <Input
              name="latitude"
              type="number"
              step="any"
              min={-90}
              max={90}
              placeholder="15.5762345"
              defaultValue={v?.latitude ?? ""}
            />
          </Field>
          <Field name="longitude" label="Longitude" hint="-180 to 180 (e.g. 73.7398421)">
            <Input
              name="longitude"
              type="number"
              step="any"
              min={-180}
              max={180}
              placeholder="73.7398421"
              defaultValue={v?.longitude ?? ""}
            />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: open the property in Google Maps, right-click → coordinates appear at the top of the menu.
        </p>
      </Section>

      <Section title="Collections" hint="Pick all that apply">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {collections.map((c) => (
            <label key={c.slug} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="collections"
                value={c.slug}
                defaultChecked={v?.collections?.includes(c.slug) ?? false}
                className="h-4 w-4"
              />
              {c.name}
            </label>
          ))}
        </div>
      </Section>

      {(() => {
        // Merge amenities + facilities into one display list, deduplicated by name.
        // Each item carries its `kind` so the checkbox posts under the right form
        // field (amenities[] vs facilities[]) — keeps the data model intact while
        // the UI shows one unified section.
        const seen = new Set<string>();
        type Merged = { name: string; iconName: string; kind: "amenity" | "facility" };
        const merged: Merged[] = [];
        for (const a of amenities) {
          const k = a.name.toLowerCase().trim();
          if (seen.has(k)) continue;
          seen.add(k);
          merged.push({ ...a, kind: "amenity" });
        }
        for (const f of facilities) {
          const k = f.name.toLowerCase().trim();
          if (seen.has(k)) continue;
          seen.add(k);
          merged.push({ ...f, kind: "facility" });
        }
        return (
          <Section
            title="Amenities"
            hint="Everything inside and around the property"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {merged.map((item) => {
                const Icon = getIconByName(item.iconName);
                const checked =
                  item.kind === "amenity"
                    ? v?.amenities?.includes(item.name) ?? false
                    : v?.facilities?.includes(item.name) ?? false;
                return (
                  <label
                    key={item.name}
                    className="inline-flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors has-[input:checked]:border-foreground has-[input:checked]:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      name={item.kind === "amenity" ? "amenities" : "facilities"}
                      value={item.name}
                      defaultChecked={checked}
                      className="h-4 w-4"
                    />
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background">
                      <Icon className="h-4 w-4 text-foreground/80" strokeWidth={1.5} />
                    </span>
                    <span className="leading-snug">{item.name}</span>
                  </label>
                );
              })}
            </div>
            <Field
              name="customAmenities"
              label="Add custom amenities"
              hint="Comma or newline separated. Anything not in the list above — e.g. Espresso machine, Yoga deck, Helipad."
            >
              <Textarea
                name="customAmenities"
                rows={2}
                placeholder="Espresso machine, Yoga deck, Outdoor jacuzzi"
                defaultValue={v?.customAmenities ?? ""}
              />
            </Field>
            {/* Preserve any existing customFacilities silently so old data
                isn't dropped on save. New custom entries all flow into the
                single textarea above (customAmenities). */}
            <input
              type="hidden"
              name="customFacilities"
              value={v?.customFacilities ?? ""}
            />
          </Section>
        );
      })()}

      <Section title="Content">
        <Field name="highlights" label="Highlights" hint="One per line">
          <Textarea
            name="highlights"
            rows={3}
            placeholder={"2-minute walk to beach\nIn-house chef on request"}
            defaultValue={v?.highlights ?? ""}
          />
        </Field>
        <Field name="houseRules" label="House rules" hint="One per line">
          <Textarea
            name="houseRules"
            rows={3}
            placeholder={"Check-in 2pm, check-out 11am\nNo loud music after 10pm"}
            defaultValue={v?.houseRules ?? ""}
          />
        </Field>
      </Section>

      <Section title="Photos" hint="Upload from your computer">
        <PhotoUploader name="imagesJson" initial={v?.images ?? []} />
        {state.fieldErrors?.images && (
          <p className="text-xs text-destructive">{state.fieldErrors.images}</p>
        )}
      </Section>

      <Section title="Video tour" hint="Optional — YouTube/Vimeo URL or upload an MP4">
        <VideoInput name="videoSrc" initial={v?.videoSrc ?? ""} />
      </Section>

      <Section title="FAQs" hint="Override the default FAQs with villa-specific Q&A">
        <FaqEditor name="faqsJson" initial={v?.faqs ?? []} />
      </Section>

      <Section
        title="External listings & reviews"
        hint="Cross-listed on Airbnb / Booking.com / Google / etc.? Add the URLs and ratings — guests will see aggregated ratings and a one-click link to read reviews there."
      >
        <ExternalListingsEditor
          name="externalListingsJson"
          initial={v?.externalListings ?? []}
        />
      </Section>

      <Section title="Meals" hint="Tell guests whether food is included with the stay">
        <div className="grid gap-3 sm:grid-cols-2">
          {mealPresets.map((p) => (
            <label
              key={p.value}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-colors ${
                mealsPreset === p.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  name="mealsPreset"
                  value={p.value}
                  checked={mealsPreset === p.value}
                  onChange={() => pickMealsPreset(p.value)}
                  className="h-4 w-4"
                />
                {p.label}
              </span>
              {p.description && (
                <span className="mt-1 pl-6 text-xs text-muted-foreground">
                  {p.description}
                </span>
              )}
            </label>
          ))}
        </div>
        <Field
          name="mealsDescription"
          label="Meals text shown to guests"
          hint="Auto-fills from preset; edit freely for custom wording"
        >
          <Textarea
            name="mealsDescription"
            value={mealsDescription}
            onChange={(e) => setMealsDescription(e.target.value)}
            rows={3}
            placeholder="Describe what's included with the stay (e.g. 'breakfast included, lunch + dinner on request')."
          />
        </Field>
      </Section>

      <Section title="Cancellation policy">
        <div className="grid gap-3 sm:grid-cols-2">
          {cancellationPresets.map((p) => (
            <label
              key={p.value}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-colors ${
                policyPreset === p.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  name="cancellationPreset"
                  value={p.value}
                  checked={policyPreset === p.value}
                  onChange={() => pickPreset(p.value)}
                  className="h-4 w-4"
                />
                {p.label}
              </span>
              {p.description && (
                <span className="mt-1 pl-6 text-xs text-muted-foreground">
                  {p.description}
                </span>
              )}
            </label>
          ))}
        </div>
        <Field
          name="cancellationDescription"
          label="Policy text shown to guests"
          hint="Auto-fills from preset; edit freely for custom wording"
        >
          <Textarea
            name="cancellationDescription"
            value={policyDescription}
            onChange={(e) => setPolicyDescription(e.target.value)}
            rows={4}
            placeholder="Describe your cancellation terms in plain language."
          />
        </Field>
      </Section>

      <Section title="Visibility">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <p className="text-sm font-medium text-foreground">Property type</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["villa", "apartment"] as const).map((t) => (
                <label
                  key={t}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="propertyType"
                    value={t}
                    defaultChecked={(v?.propertyType ?? "villa") === t}
                    className="h-4 w-4"
                  />
                  <span className="capitalize">{t}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Villas appear under <code className="rounded bg-muted px-1">/villas</code>; apartments
              under <code className="rounded bg-muted px-1">/apartments</code>.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={v?.featured ?? false}
              className="h-4 w-4"
            />
            Show on the homepage as a featured property
          </label>

          <div className="grid gap-1.5">
            <Label
              htmlFor="featuredRank"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Home page position
            </Label>
            <select
              id="featuredRank"
              name="featuredRank"
              defaultValue={v?.featuredRank ?? ""}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-48"
            >
              <option value="">Auto (after ranked)</option>
              <option value="1">1 (first)</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6 (last)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Only used when Featured is on. Max 6 featured villas + 6
              featured apartments show on the home page; anything beyond
              that is hidden.
            </p>
          </div>
        </div>
      </Section>

      <div className="sticky bottom-4 flex items-center gap-4 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur">
        <Button type="submit" disabled={pending} size="lg" className="rounded-full">
          {pending ? "Saving…" : "Save property"}
        </Button>
        <a href="/admin/villas" className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </a>
      </div>
    </form>
  );
}

const FIELD_LABELS: Record<string, string> = {
  name: "Villa name",
  slug: "Slug",
  tagline: "Tagline",
  description: "Description",
  destinationSlug: "Destination",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  maxGuests: "Max guests",
  pricePerNight: "Price per night",
  locationNote: "Location note",
  images: "Photos",
  latitude: "Latitude",
  longitude: "Longitude",
};

function prettyField(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-2xl border border-border/60 bg-card p-6">
      <header>
        <h2 className="font-display text-xl">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name} className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
