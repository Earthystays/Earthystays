"use client";

import { useActionState, useState, useEffect, useRef, useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhotoUploader } from "@/components/photo-uploader";
import { VideoInput } from "@/components/video-input";
import { BrochureUploader } from "@/components/brochure-uploader";
import { FaqEditor } from "@/components/faq-editor";
import { ExternalListingsEditor } from "@/components/external-listings-editor";
import { AlertTriangle, Check, Save, Loader2, ChevronLeft, ChevronRight, Home, Building2, Hotel, BedDouble } from "lucide-react";
import type { PropertyType } from "@/lib/types";
import { addVilla, autoSaveDraft, type AddVillaState, type AddVillaValues } from "./actions";

/** Property-type options for the Add Property selector (Phase B).
 *  Villa & apartment behave exactly as before; hotel & hostel add
 *  room/dorm configuration in later steps. */
const PROPERTY_TYPES: {
  value: PropertyType;
  label: string;
  hint: string;
  Icon: typeof Home;
}[] = [
  { value: "villa", label: "Villa", hint: "Entire property for private stays.", Icon: Home },
  { value: "apartment", label: "Apartment", hint: "A self-contained entire home.", Icon: Building2 },
  { value: "hotel", label: "Hotel", hint: "Rooms rented individually.", Icon: Hotel },
  { value: "hostel", label: "Hostel", hint: "Dormitories and individual beds.", Icon: BedDouble },
];
import { getIconByName } from "@/lib/amenity-catalog";

type LocationOpt = { slug: string; name: string };
type CityOption = {
  slug: string;
  name: string;
  locations?: LocationOpt[];
};
type DestinationOption = {
  slug: string;
  name: string;
  cities?: CityOption[];
};

type AmenityChoice = { name: string; iconName: string };

const INITIAL: AddVillaState = { ok: false };

type CancellationPreset = { value: string; label: string; description: string };
type MealPreset = { value: string; label: string; description: string };

export function NewVillaForm({
  destinations,
  collections,
  experienceOptions,
  amenities,
  facilities,
  states,
  cancellationPresets,
  mealPresets,
  initialState,
  draftId: incomingDraftId,
}: {
  destinations: DestinationOption[];
  collections: { slug: string; name: string }[];
  experienceOptions: { slug: string; name: string; blurb: string }[];
  amenities: AmenityChoice[];
  facilities: AmenityChoice[];
  states: string[];
  cancellationPresets: CancellationPreset[];
  mealPresets: MealPreset[];
  initialState?: AddVillaState;
  /** When resuming an existing draft, pass its id here. Omit for new
   *  villas — the form will mint a draftId on mount. */
  draftId?: string;
}) {
  const [state, action, pending] = useActionState(addVilla, initialState ?? INITIAL);
  const v = state.values;

  const STEPS = [
    { id: "basics", title: "Basics", hint: "Name, capacity & pricing" },
    { id: "location", title: "Location", hint: "Where the property is" },
    { id: "details", title: "Details", hint: "Amenities, content & policies" },
    { id: "media", title: "Media & publish", hint: "Photos, brochure & visibility" },
  ] as const;
  const [step, setStep] = useState(0);
  const [propertyType, setPropertyType] = useState<PropertyType>(
    v?.propertyType ?? "villa",
  );
  const isMultiUnit = propertyType === "hotel" || propertyType === "hostel";
  const isLast = step === STEPS.length - 1;
  const goStep = (i: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, i)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formRef = useRef<HTMLFormElement>(null);
  const reactId = useId();
  const [draftId] = useState(
    () => incomingDraftId ?? `draft-${reactId.replace(/[^a-z0-9]/gi, "")}-${Date.now()}`,
  );
  const [draftStatus, setDraftStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

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

  // Cascading State → City → Locality. State is destinationSlug (each
  // destination IS a state). City is sourced from the selected
  // destination's cities[]; an "Other (specify)" option lets admins type
  // a custom city for backward compatibility with existing data.
  const CUSTOM = "__custom__";
  const [destSlug, setDestSlug] = useState<string>(v?.destinationSlug ?? "");
  const initialDest = destinations.find((d) => d.slug === (v?.destinationSlug ?? ""));
  const initialCity = v?.city ?? "";
  const initialIsCustom =
    initialCity.length > 0 &&
    !(initialDest?.cities ?? []).some((c) => c.name === initialCity);
  const [cityChoice, setCityChoice] = useState<string>(
    initialCity ? (initialIsCustom ? CUSTOM : initialCity) : "",
  );
  const [cityCustom, setCityCustom] = useState<string>(
    initialIsCustom ? initialCity : "",
  );
  const selectedDest = destinations.find((d) => d.slug === destSlug);
  const cityOptions = selectedDest?.cities ?? [];
  const finalCity = cityChoice === CUSTOM ? cityCustom : cityChoice;
  const finalState = selectedDest?.name ?? v?.state ?? "";

  // Locations under the selected city
  const selectedCity = cityOptions.find(
    (c) => c.name === (cityChoice === CUSTOM ? "" : cityChoice),
  );
  const locationOptions = selectedCity?.locations ?? [];
  const initialLocation = v?.locationNote ?? "";
  const initialLocationIsCustom =
    initialLocation.length > 0 &&
    locationOptions.length > 0 &&
    !locationOptions.some((l) => l.name === initialLocation);
  const [locationChoice, setLocationChoice] = useState<string>(
    initialLocation
      ? initialLocationIsCustom || locationOptions.length === 0
        ? CUSTOM
        : initialLocation
      : "",
  );
  const [locationCustom, setLocationCustom] = useState<string>(
    initialLocationIsCustom || locationOptions.length === 0
      ? initialLocation
      : "",
  );
  const finalLocation =
    locationChoice === CUSTOM ? locationCustom : locationChoice;

  // Restore cancellation + meals state from the server-action snapshot after
  // a validation error. `v` comes from useActionState (external) so the
  // effect is the right place — we need to react when the server hands us
  // new values.
  useEffect(() => {
    if (!v) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: restoring state from server action snapshot
    setPolicyPreset(v.cancellationPreset ?? "");
    setPolicyDescription(v.cancellationDescription ?? "");
    setMealsPreset(v.mealsPreset ?? "");
    setMealsDescription(v.mealsDescription ?? "");
    // Re-sync the cascading location pickers after a validation
    // round-trip so the chosen state/city aren't cleared.
    const dSlug = v.destinationSlug ?? "";
    setDestSlug(dSlug);
    const dest = destinations.find((dd) => dd.slug === dSlug);
    const cities = dest?.cities ?? [];
    const cityIsCustom =
      !!v.city && cities.length > 0 && !cities.some((c) => c.name === v.city);
    setCityChoice(v.city ? (cityIsCustom ? CUSTOM : v.city) : "");
    setCityCustom(cityIsCustom ? v.city ?? "" : "");
    // Re-sync the Location picker after a validation round-trip.
    const matchedCity = cities.find((c) => c.name === v.city);
    const locs = matchedCity?.locations ?? [];
    const locIsCustom =
      !!v.locationNote &&
      locs.length > 0 &&
      !locs.some((l) => l.name === v.locationNote);
    setLocationChoice(
      v.locationNote
        ? locIsCustom || locs.length === 0
          ? CUSTOM
          : v.locationNote
        : "",
    );
    setLocationCustom(
      locIsCustom || locs.length === 0 ? v.locationNote ?? "" : "",
    );
  }, [v, destinations]);

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

  // Auto-save: every time the form changes, debounce 2.5s and push a
  // snapshot to /data/villa-drafts.json. The slug isn't required and we
  // skip validation, so partial drafts are fine. Cleared on successful
  // publish (server side, see actions.ts).
  useEffect(() => {
    const formEl = formRef.current;
    if (!formEl) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function snapshot(): Partial<AddVillaValues> {
      const fd = new FormData(formEl!);
      const obj: Record<string, unknown> = {};
      for (const [key, value] of fd.entries()) {
        if (key === "imagesJson" || key === "faqsJson" || key === "externalListingsJson") {
          try {
            obj[key === "imagesJson" ? "images" : key === "faqsJson" ? "faqs" : "externalListings"] =
              JSON.parse(String(value));
          } catch {
            // ignore malformed JSON snapshots
          }
          continue;
        }
        if (key === "amenities" || key === "facilities" || key === "collections" || key === "experiences") {
          if (!Array.isArray(obj[key])) obj[key] = [];
          (obj[key] as string[]).push(String(value));
          continue;
        }
        obj[key] = value;
      }
      return obj as Partial<AddVillaValues>;
    }
    function schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        setDraftStatus("saving");
        try {
          const res = await autoSaveDraft(draftId, snapshot());
          if (res.ok) {
            setDraftStatus("saved");
            setLastSavedAt(res.savedAt);
          }
        } catch {
          setDraftStatus("error");
        }
      }, 2500);
    }
    formEl.addEventListener("input", schedule);
    formEl.addEventListener("change", schedule);
    return () => {
      if (timer) clearTimeout(timer);
      formEl.removeEventListener("input", schedule);
      formEl.removeEventListener("change", schedule);
    };
  }, [draftId]);

  return (
    <form ref={formRef} action={action} className="mt-10 grid gap-8" key={state.attemptId ?? "initial"}>
      <input type="hidden" name="draftId" value={draftId} />
      <DraftStatusBanner status={draftStatus} savedAt={lastSavedAt} />
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

      <StepNav steps={STEPS} current={step} onSelect={goStep} />

      <div hidden={step !== 0} className="grid gap-8">
      {/* Property type — drives the rest of the form (Phase B). Villa &
          apartment behave exactly as before; hotel & hostel unlock room /
          dorm configuration in later steps. State is mirrored into a hidden
          input so the existing addVilla action reads it unchanged. */}
      <input type="hidden" name="propertyType" value={propertyType} />
      <Section title="Property type">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROPERTY_TYPES.map(({ value, label, hint, Icon }) => {
            const selected = propertyType === value;
            return (
              <button
                type="button"
                key={value}
                onClick={() => setPropertyType(value)}
                aria-pressed={selected}
                className={`flex flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left transition ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </button>
            );
          })}
        </div>
        {isMultiUnit && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Save the basics here, then add{" "}
              {propertyType === "hotel" ? "room types & inventory" : "dorm types & beds"}{" "}
              from the property page. The fields below capture the {propertyType}&rsquo;s
              starting price and headline capacity.
            </span>
          </p>
        )}
      </Section>

      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label={isMultiUnit ? "Property name" : "Villa name"} error={state.fieldErrors?.name}>
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
          <Field name="pricePerNight" label={isMultiUnit ? "Starting price/night (₹)" : "Price/night (₹)"} error={state.fieldErrors?.pricePerNight}>
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

      </div>

      <div hidden={step !== 1} className="grid gap-8">
      <Section title="Location" hint="Lat/long enables a map embed on the detail page">
        {/* Hidden inputs the server action reads. They mirror the
            cascading controlled selects below so admin only picks State
            → City → Location; the rest is derived. */}
        <input type="hidden" name="destinationSlug" value={destSlug} />
        <input type="hidden" name="state" value={finalState} />
        <input type="hidden" name="city" value={finalCity} />
        <input type="hidden" name="locationNote" value={finalLocation} />

        <div className="grid gap-4 sm:grid-cols-3">
          {/* STATE */}
          <Field
            name="destinationSlug"
            label="State"
            error={state.fieldErrors?.destinationSlug}
          >
            <select
              required
              value={destSlug}
              onChange={(e) => {
                setDestSlug(e.target.value);
                setCityChoice("");
                setCityCustom("");
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>Choose state…</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>{d.name}</option>
              ))}
            </select>
          </Field>

          {/* CITY */}
          <Field
            name="city"
            label="City"
            hint={
              destSlug && cityOptions.length === 0
                ? "No preset cities — pick Other to type"
                : "Choose from preset or pick Other"
            }
            error={state.fieldErrors?.city}
          >
            <select
              value={cityChoice}
              onChange={(e) => setCityChoice(e.target.value)}
              disabled={!destSlug}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="">
                {destSlug ? "Choose city…" : "Pick a state first"}
              </option>
              {cityOptions.map((c) => (
                <option key={c.slug} value={c.name}>{c.name}</option>
              ))}
              {destSlug && (
                <option value={CUSTOM}>Other (specify)…</option>
              )}
            </select>
          </Field>

          {/* LOCATION */}
          <Field
            name="locationNote"
            label="Location"
            hint={
              locationOptions.length > 0
                ? "Pick a locality or Other"
                : cityChoice === ""
                  ? "Pick a city first"
                  : "Type a locality"
            }
            error={state.fieldErrors?.locationNote}
          >
            {locationOptions.length > 0 ? (
              <select
                value={locationChoice}
                onChange={(e) => setLocationChoice(e.target.value)}
                disabled={!cityChoice || cityChoice === CUSTOM}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
              >
                <option value="">Choose location…</option>
                {locationOptions.map((l) => (
                  <option key={l.slug} value={l.name}>
                    {l.name}
                  </option>
                ))}
                <option value={CUSTOM}>Other (specify)…</option>
              </select>
            ) : (
              <Input
                value={locationCustom}
                onChange={(e) => {
                  setLocationCustom(e.target.value);
                  setLocationChoice(CUSTOM);
                }}
                placeholder="e.g. Anjuna, off Ozran Beach Rd"
                disabled={!cityChoice}
              />
            )}
          </Field>
        </div>

        {cityChoice === CUSTOM && (
          <Field name="cityCustom" label="Custom city name">
            <Input
              value={cityCustom}
              onChange={(e) => setCityCustom(e.target.value)}
              placeholder="e.g. Vagator"
              autoFocus
            />
          </Field>
        )}

        {locationChoice === CUSTOM && locationOptions.length > 0 && (
          <Field name="locationCustom" label="Custom location name">
            <Input
              value={locationCustom}
              onChange={(e) => setLocationCustom(e.target.value)}
              placeholder="e.g. Off Ozran Beach Rd"
              autoFocus
            />
          </Field>
        )}
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
        <Field
          name="googlePlaceId"
          label="Google Place ID (optional)"
          hint="Enables Google review import on the villa page"
        >
          <Input
            name="googlePlaceId"
            placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            defaultValue={v?.googlePlaceId ?? ""}
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          Find it with Google&apos;s{" "}
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noreferrer"
            className="text-terracotta hover:underline"
          >
            Place ID finder
          </a>{" "}
          — search the property&apos;s name as it appears on Google Maps.
        </p>
      </Section>

      </div>

      <div hidden={step !== 2} className="grid gap-8">
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

      {experienceOptions.length > 0 && (
        <Section
          title="Experiences"
          hint='Concierge add-ons offered on this property’s page as "Enhance Your Stay" — pick the ones available at this location'
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {experienceOptions.map((e) => (
              <label
                key={e.slug}
                className="flex cursor-pointer flex-col rounded-lg border border-border/60 bg-card px-3 py-2.5 transition-colors hover:bg-muted/50 has-[input:checked]:border-foreground has-[input:checked]:bg-muted/60"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="experiences"
                    value={e.slug}
                    defaultChecked={v?.experiences?.includes(e.slug) ?? false}
                    className="h-4 w-4"
                  />
                  {e.name}
                </span>
                {e.blurb && (
                  <span className="mt-1 pl-6 text-xs text-muted-foreground">
                    {e.blurb}
                  </span>
                )}
              </label>
            ))}
          </div>
        </Section>
      )}

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

      </div>

      <div hidden={step !== 3} className="grid gap-8">
      <Section title="Photos" hint="Upload from your computer">
        <PhotoUploader name="imagesJson" initial={v?.images ?? []} />
        {state.fieldErrors?.images && (
          <p className="text-xs text-destructive">{state.fieldErrors.images}</p>
        )}
      </Section>

      <Section title="Video tour" hint="Optional — YouTube/Vimeo URL or upload an MP4">
        <VideoInput name="videoSrc" initial={v?.videoSrc ?? ""} />
      </Section>

      <Section
        title="Property Brochure"
        hint="Upload a PDF brochure that guests can view or download from the property listing."
      >
        <BrochureUploader name="brochureJson" initial={v?.brochure ?? null} />
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
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
              <span className="capitalize font-medium">{propertyType}</span>
              <button
                type="button"
                onClick={() => goStep(0)}
                className="ml-auto text-xs text-primary underline-offset-2 hover:underline"
              >
                Change in step 1
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Villas appear under <code className="rounded bg-muted px-1">/villas</code>; apartments
              under <code className="rounded bg-muted px-1">/apartments</code>. Hotels & hostels get
              their own pages once rooms/dorms are added.
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

      </div>

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <a href="/admin/villas" className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </a>
          <span className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length} · {STEPS[step].title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => goStep(step - 1)}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {!isLast ? (
            <Button
              type="button"
              onClick={() => goStep(step + 1)}
              size="lg"
              className="rounded-full"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={pending} size="lg" className="rounded-full">
              {pending ? "Saving…" : "Save property"}
            </Button>
          )}
        </div>
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

function StepNav({
  steps,
  current,
  onSelect,
}: {
  steps: readonly { id: string; title: string; hint: string }[];
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <nav aria-label="Progress" className="rounded-2xl border border-border/60 bg-card p-2">
      <ol className="grid gap-2 sm:grid-cols-4">
        {steps.map((s, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                    active
                      ? "border-background/40 bg-background/10 text-background"
                      : done
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-tight">{s.title}</span>
                  <span
                    className={`block text-[11px] leading-tight ${
                      active ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {s.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
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

function DraftStatusBanner({
  status,
  savedAt,
}: {
  status: "idle" | "saving" | "saved" | "error";
  savedAt: string | null;
}) {
  if (status === "idle") {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Save className="h-3.5 w-3.5" />
        Your progress is auto-saved to Drafts as you type. Publish when ready.
      </p>
    );
  }
  if (status === "saving") {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving draft…
      </p>
    );
  }
  if (status === "saved") {
    return (
      <p className="flex items-center gap-2 text-xs text-emerald-700">
        <Check className="h-3.5 w-3.5" />
        Draft saved
        {savedAt && (
          <span className="text-muted-foreground">
            · {new Date(savedAt).toLocaleTimeString()}
          </span>
        )}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-xs text-destructive">
      <AlertTriangle className="h-3.5 w-3.5" />
      Couldn&apos;t save draft. Your changes are still in the form — try again
      in a moment.
    </p>
  );
}
