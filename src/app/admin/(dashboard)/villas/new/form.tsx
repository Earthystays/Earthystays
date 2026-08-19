"use client";

import { useActionState, useState, useEffect, useRef, useId, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhotoUploader } from "@/components/photo-uploader";
import { VideoInput } from "@/components/video-input";
import { BrochureUploader } from "@/components/brochure-uploader";
import { FaqEditor } from "@/components/faq-editor";
import { ExternalListingsEditor } from "@/components/external-listings-editor";
import {
  AlertTriangle,
  Check,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Home,
  Building2,
  Hotel,
  BedDouble,
  Search,
  MapPin,
  Pencil,
} from "lucide-react";
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

/** Steps for the property-creation workflow. Order maps 1:1 to the panes
 *  below. Kept small on purpose — the whole form is one <form>, only the
 *  visible pane changes. */
const STEPS = [
  { id: "basics", title: "Basic Details", hint: "Name, capacity & description" },
  { id: "location", title: "Location", hint: "Address & map" },
  { id: "photos", title: "Photos", hint: "Gallery, video & brochure" },
  { id: "amenities", title: "Amenities", hint: "Features & experiences" },
  { id: "pricing", title: "Pricing", hint: "Rates & visibility" },
  { id: "policies", title: "Policies", hint: "Rules, meals & cancellation" },
  { id: "review", title: "Review", hint: "Check & publish" },
] as const;

/** Logical amenity groups — keyword-matched so preset AND custom amenities
 *  land in a sensible bucket. First matching group wins; anything unmatched
 *  falls into "More". Keeps a long flat list scannable. */
const AMENITY_GROUPS: { title: string; keywords: string[] }[] = [
  {
    title: "Essentials",
    keywords: [
      "wifi", "wi-fi", "air condition", "heat", "fan", "kitchen", "hot water",
      "geyser", "fridge", "freezer", "microwave", "coffee", "kettle", "cooker",
      "crockery", "cutlery", "blender", "water purifier", "washing", "iron",
      "towel", "linen", "hanger", "essential", "wardrobe", "mattress",
      "hairdryer", "shampoo", "conditioner", "shower gel", "power backup",
      "parking", "self check", "lift",
    ],
  },
  {
    title: "Outdoor",
    keywords: [
      "pool", "hot tub", "sea", "beach", "mountain", "view", "garden", "lawn",
      "gazebo", "balcony", "terrace", "bonfire", "outdoor", "bbq", "sauna",
      "steam", "spa", "bar",
    ],
  },
  {
    title: "Entertainment",
    keywords: [
      "tv", "speaker", "music", "theatre", "game", "board", "gym", "workstation",
      "workspace", "kids", "crib", "high chair", "pet",
    ],
  },
  {
    title: "Services & safety",
    keywords: [
      "security", "cctv", "camera", "smoke", "fire", "first aid", "safe",
      "wheelchair", "entrance", "ev charging", "caretaker", "housekeeping",
      "laundry", "chef", "cook", "conference", "staff", "smoking", "blanket",
      "fireplace", "breakfast", "building",
    ],
  },
];

function groupFor(name: string): string {
  const n = name.toLowerCase();
  for (const g of AMENITY_GROUPS) {
    if (g.keywords.some((k) => n.includes(k))) return g.title;
  }
  return "More";
}

const GROUP_ORDER = [...AMENITY_GROUPS.map((g) => g.title), "More"];

/** Pull lat/long out of a pasted Google Maps URL. Handles the common
 *  `@lat,lng`, `q=lat,lng` and `!3d..!4d..` forms. */
function parseCoordsFromMapsUrl(url: string): { lat: string; lng: string } | null {
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return { lat: m[1], lng: m[2] };
  }
  return null;
}

/** Read the whole form into an AddVillaValues-shaped snapshot. Shared by
 *  auto-save, the manual "Save draft" button and the Review summary. */
function snapshotForm(formEl: HTMLFormElement): Partial<AddVillaValues> {
  const fd = new FormData(formEl);
  const obj: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    if (key === "imagesJson" || key === "faqsJson" || key === "externalListingsJson") {
      try {
        obj[
          key === "imagesJson" ? "images" : key === "faqsJson" ? "faqs" : "externalListings"
        ] = JSON.parse(String(value));
      } catch {
        // ignore malformed JSON snapshots
      }
      continue;
    }
    if (key === "brochureJson") {
      try {
        obj.brochure = JSON.parse(String(value));
      } catch {
        /* ignore */
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

  const [step, setStep] = useState(0);
  const [propertyType, setPropertyType] = useState<PropertyType>(
    v?.propertyType ?? "villa",
  );
  const isMultiUnit = propertyType === "hotel" || propertyType === "hostel";
  const isLast = step === STEPS.length - 1;

  const formRef = useRef<HTMLFormElement>(null);
  const goStep = (i: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, i)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // Lat/long controlled so the map preview updates live and the "paste a
  // maps link" helper can fill them.
  const [lat, setLat] = useState<string>(v?.latitude ?? "");
  const [lng, setLng] = useState<string>(v?.longitude ?? "");
  const [mapsUrl, setMapsUrl] = useState<string>("");

  // Amenity search filter
  const [amenityQuery, setAmenityQuery] = useState("");

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

  // Restore cancellation + meals + location state from the server-action
  // snapshot after a validation error.
  useEffect(() => {
    if (!v) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: restoring state from server action snapshot
    setPolicyPreset(v.cancellationPreset ?? "");
    setPolicyDescription(v.cancellationDescription ?? "");
    setMealsPreset(v.mealsPreset ?? "");
    setMealsDescription(v.mealsDescription ?? "");
    setLat(v.latitude ?? "");
    setLng(v.longitude ?? "");
    const dSlug = v.destinationSlug ?? "";
    setDestSlug(dSlug);
    const dest = destinations.find((dd) => dd.slug === dSlug);
    const cities = dest?.cities ?? [];
    const cityIsCustom =
      !!v.city && cities.length > 0 && !cities.some((c) => c.name === v.city);
    setCityChoice(v.city ? (cityIsCustom ? CUSTOM : v.city) : "");
    setCityCustom(cityIsCustom ? v.city ?? "" : "");
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

  // Auto-save: debounce 2.5s on any change and push a snapshot to drafts.
  useEffect(() => {
    const formEl = formRef.current;
    if (!formEl) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        setDraftStatus("saving");
        try {
          const res = await autoSaveDraft(draftId, snapshotForm(formEl!));
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

  async function saveDraftNow() {
    const formEl = formRef.current;
    if (!formEl) return;
    setDraftStatus("saving");
    try {
      const res = await autoSaveDraft(draftId, snapshotForm(formEl));
      if (res.ok) {
        setDraftStatus("saved");
        setLastSavedAt(res.savedAt);
      }
    } catch {
      setDraftStatus("error");
    }
  }

  // Review snapshot — rebuilt whenever we land on the final step.
  const [review, setReview] = useState<Partial<AddVillaValues> | null>(null);
  useEffect(() => {
    if (step === STEPS.length - 1 && formRef.current) {
      setReview(snapshotForm(formRef.current));
    }
  }, [step]);

  // Merge amenities + facilities into one display list, deduped by name,
  // then bucket into logical groups + apply the search filter.
  const groupedAmenities = useMemo(() => {
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
    const q = amenityQuery.trim().toLowerCase();
    const filtered = q ? merged.filter((m) => m.name.toLowerCase().includes(q)) : merged;
    const groups = new Map<string, Merged[]>();
    for (const t of GROUP_ORDER) groups.set(t, []);
    for (const m of filtered) groups.get(groupFor(m.name))!.push(m);
    return GROUP_ORDER.map((title) => ({ title, items: groups.get(title)! })).filter(
      (g) => g.items.length > 0,
    );
  }, [amenities, facilities, amenityQuery]);

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const hasCoords =
    lat !== "" && lng !== "" && Number.isFinite(latNum) && Number.isFinite(lngNum);
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lngNum - 0.006}%2C${
        latNum - 0.006
      }%2C${lngNum + 0.006}%2C${latNum + 0.006}&layer=mapnik&marker=${latNum}%2C${lngNum}`
    : null;

  return (
    <form ref={formRef} action={action} className="mt-8 grid gap-8 pb-28" key={state.attemptId ?? "initial"}>
      <input type="hidden" name="draftId" value={draftId} />

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

      <Stepper steps={STEPS} current={step} onSelect={goStep} />

      {/* ————————————————————————— 01 · BASIC DETAILS ————————————————————————— */}
      <div hidden={step !== 0} className="grid gap-8">
        <input type="hidden" name="propertyType" value={propertyType} />
        <Section title="Property type" hint="Choose what you’re listing — this shapes the rest of the form.">
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
            <p className="mt-1 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs text-foreground">
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

        {/* Two-column: Property information | Description */}
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          <Section title="Property information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Property name" error={state.fieldErrors?.name}>
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
            <div className="grid gap-4 sm:grid-cols-3">
              <Field name="bedrooms" label="Bedrooms" error={state.fieldErrors?.bedrooms}>
                <Input name="bedrooms" type="number" min={1} required defaultValue={v?.bedrooms ?? "4"} />
              </Field>
              <Field name="bathrooms" label="Bathrooms" error={state.fieldErrors?.bathrooms}>
                <Input name="bathrooms" type="number" min={1} required defaultValue={v?.bathrooms ?? "4"} />
              </Field>
              <Field name="maxGuests" label="Max guests" error={state.fieldErrors?.maxGuests}>
                <Input name="maxGuests" type="number" min={1} required defaultValue={v?.maxGuests ?? "8"} />
              </Field>
            </div>
          </Section>

          <Section title="Description">
            <Field name="tagline" label="Short description" hint="One line — shown on cards & search." error={state.fieldErrors?.tagline}>
              <Input
                name="tagline"
                required
                placeholder="Blue-shuttered Portuguese villa, two minutes from the cove."
                defaultValue={v?.tagline ?? ""}
              />
            </Field>
            <Field name="description" label="Detailed description" hint="Describe the property, its highlights and what makes it special." error={state.fieldErrors?.description}>
              <Textarea name="description" required rows={8} defaultValue={v?.description ?? ""} />
            </Field>
          </Section>
        </div>
      </div>

      {/* ————————————————————————— 02 · LOCATION ————————————————————————— */}
      <div hidden={step !== 1} className="grid gap-8">
        <Section title="Location" hint="Where the property is. State → City → Locality.">
          <input type="hidden" name="destinationSlug" value={destSlug} />
          <input type="hidden" name="state" value={finalState} />
          <input type="hidden" name="city" value={finalCity} />
          <input type="hidden" name="locationNote" value={finalLocation} />

          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="destinationSlug" label="State" error={state.fieldErrors?.destinationSlug}>
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
                {destSlug && <option value={CUSTOM}>Other (specify)…</option>}
              </select>
            </Field>

            <Field
              name="locationNote"
              label="Locality / area"
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
                    <option key={l.slug} value={l.name}>{l.name}</option>
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
        </Section>

        <Section title="Map location" hint="Coordinates power the map embed on the property page.">
          {/* Paste-a-link helper — the practical way ops set a pin. */}
          <div className="grid gap-2">
            <Label className="admin-label">Paste a Google Maps link</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/…  or  https://maps.app.goo.gl/…"
                className="sm:flex-1"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-[10px] font-semibold"
                onClick={() => {
                  const parsed = parseCoordsFromMapsUrl(mapsUrl);
                  if (parsed) {
                    setLat(parsed.lat);
                    setLng(parsed.lng);
                  }
                }}
              >
                <MapPin className="h-4 w-4" />
                Use location
              </Button>
            </div>
            <p className="admin-helper">
              Open the property in Google Maps, copy the link, and paste it here — we’ll pull the
              coordinates. Or enter them by hand below.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="latitude" label="Latitude" hint="-90 to 90 (e.g. 15.5762345)">
              <Input
                name="latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                placeholder="15.5762345"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
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
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </Field>
          </div>

          {/* Live preview */}
          <div className="overflow-hidden rounded-xl border border-[hsl(38_20%_88%)] bg-muted/40">
            {mapSrc ? (
              <iframe
                title="Map preview"
                src={mapSrc}
                className="h-[320px] w-full border-0"
                loading="lazy"
              />
            ) : (
              <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <MapPin className="h-6 w-6 opacity-40" />
                <p>Enter coordinates or paste a maps link to preview the pin.</p>
              </div>
            )}
          </div>
        </Section>

        <Section title="Google reviews (optional)" hint="Enables Google review import on the property page.">
          <Field name="googlePlaceId" label="Google Place ID">
            <Input
              name="googlePlaceId"
              placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
              defaultValue={v?.googlePlaceId ?? ""}
            />
          </Field>
          <p className="admin-helper">
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

      {/* ————————————————————————— 03 · PHOTOS ————————————————————————— */}
      <div hidden={step !== 2} className="grid gap-8">
        <Section title="Property photos" hint="Drag to reorder. The first image is the cover photo.">
          <PhotoUploader name="imagesJson" initial={v?.images ?? []} />
          {state.fieldErrors?.images && (
            <p className="text-xs text-destructive">{state.fieldErrors.images}</p>
          )}
        </Section>

        <Section title="Video tour" hint="Optional — YouTube/Vimeo URL or upload an MP4">
          <VideoInput name="videoSrc" initial={v?.videoSrc ?? ""} />
        </Section>

        <Section
          title="Property brochure"
          hint="Upload a PDF brochure that guests can view or download from the property listing."
        >
          <BrochureUploader name="brochureJson" initial={v?.brochure ?? null} />
        </Section>
      </div>

      {/* ————————————————————————— 04 · AMENITIES ————————————————————————— */}
      <div hidden={step !== 3} className="grid gap-8">
        <Section title="Amenities" hint="Everything inside and around the property.">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={amenityQuery}
              onChange={(e) => setAmenityQuery(e.target.value)}
              placeholder="Search amenities…"
              className="pl-9"
            />
          </div>

          {groupedAmenities.length === 0 && (
            <p className="admin-helper">No amenities match “{amenityQuery}”.</p>
          )}

          <div className="grid gap-6">
            {groupedAmenities.map((group) => (
              <div key={group.title} className="grid gap-3">
                <p className="admin-label">{group.title}</p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => {
                    const Icon = getIconByName(item.iconName);
                    const checked =
                      item.kind === "amenity"
                        ? v?.amenities?.includes(item.name) ?? false
                        : v?.facilities?.includes(item.name) ?? false;
                    return (
                      <label
                        key={item.name}
                        className="inline-flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm transition-colors hover:bg-muted/50 has-[input:checked]:border-foreground has-[input:checked]:bg-muted/60"
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
              </div>
            ))}
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
          {/* Preserve any existing customFacilities silently. */}
          <input type="hidden" name="customFacilities" value={v?.customFacilities ?? ""} />
        </Section>

        <Section title="Collections" hint="Pick all that apply.">
          <div className="flex flex-wrap gap-2.5">
            {collections.map((c) => (
              <label
                key={c.slug}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-sm transition-colors hover:bg-muted/50 has-[input:checked]:border-foreground has-[input:checked]:bg-muted/60"
              >
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

        {experienceOptions.length > 0 && (
          <Section
            title="Experiences"
            hint='Add-ons shown on this property’s page as "Enhance Your Stay" — pick what’s available here.'
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
                    <span className="mt-1 pl-6 text-xs text-muted-foreground">{e.blurb}</span>
                  )}
                </label>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* ————————————————————————— 05 · PRICING ————————————————————————— */}
      <div hidden={step !== 4} className="grid gap-8">
        <Section title="Pricing" hint="What guests pay to book this property.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              name="pricePerNight"
              label={isMultiUnit ? "Starting price / night (₹)" : "Price / night (₹)"}
              error={state.fieldErrors?.pricePerNight}
            >
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
          {isMultiUnit && (
            <p className="admin-helper">
              This is the headline “from” price. Per-room / per-dorm rates are set in the
              inventory editor on the property page after saving.
            </p>
          )}
        </Section>

        <Section title="Ratings" hint="Seed the property’s displayed rating (guest reviews add to this over time).">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="rating" label="Rating (0–5)">
              <Input name="rating" type="number" min={0} max={5} step={0.1} defaultValue={v?.rating ?? "4.8"} />
            </Field>
            <Field name="reviewCount" label="Review count">
              <Input name="reviewCount" type="number" min={0} defaultValue={v?.reviewCount ?? "0"} />
            </Field>
          </div>
        </Section>

        <Section title="Visibility" hint="Where this property appears on the site.">
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
            <Label htmlFor="featuredRank" className="admin-label">
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
            <p className="admin-helper">
              Only used when Featured is on. Max 6 featured villas + 6 featured apartments show on
              the home page; anything beyond that is hidden.
            </p>
          </div>
        </Section>
      </div>

      {/* ————————————————————————— 06 · POLICIES ————————————————————————— */}
      <div hidden={step !== 5} className="grid gap-8">
        <Section title="Highlights & house rules">
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

        <Section title="Meals" hint="Tell guests whether food is included with the stay.">
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
                  <span className="mt-1 pl-6 text-xs text-muted-foreground">{p.description}</span>
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
                  <span className="mt-1 pl-6 text-xs text-muted-foreground">{p.description}</span>
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

        <Section title="FAQs" hint="Override the default FAQs with property-specific Q&A.">
          <FaqEditor name="faqsJson" initial={v?.faqs ?? []} />
        </Section>

        <Section
          title="External listings & reviews"
          hint="Cross-listed on Airbnb / Booking.com / Google? Add URLs and ratings — guests see aggregated ratings and a link to read reviews there."
        >
          <ExternalListingsEditor name="externalListingsJson" initial={v?.externalListings ?? []} />
        </Section>
      </div>

      {/* ————————————————————————— 07 · REVIEW ————————————————————————— */}
      <div hidden={step !== 6} className="grid gap-8">
        <ReviewPane
          review={review}
          propertyType={propertyType}
          state={finalState}
          city={finalCity}
          locality={finalLocation}
          policyPreset={policyPreset}
          onEdit={goStep}
        />
      </div>

      {/* ————————————————————————— STICKY ACTION BAR ————————————————————————— */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[hsl(38_20%_88%)] bg-[hsl(40_44%_98%)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <a href="/admin/villas" className="hidden text-sm font-medium text-[#857B6C] hover:text-[#23211C] sm:inline">
              Cancel
            </a>
            <span className="hidden h-4 w-px bg-[hsl(38_20%_82%)] sm:inline-block" />
            <DraftStatusInline status={draftStatus} savedAt={lastSavedAt} step={step} />
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => goStep(step - 1)}
                className="rounded-[10px] font-semibold"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={saveDraftNow}
              className="rounded-[10px] font-semibold"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save draft</span>
            </Button>
            {!isLast ? (
              <Button
                type="button"
                onClick={() => goStep(step + 1)}
                className="rounded-[10px] bg-[#3E4A3A] font-semibold hover:bg-[#2C3529]"
              >
                <span className="hidden sm:inline">Continue: {STEPS[step + 1].title}</span>
                <span className="sm:hidden">Continue</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
                className="rounded-[10px] bg-[#3E4A3A] font-semibold hover:bg-[#2C3529]"
              >
                {pending ? "Publishing…" : "Publish property"}
              </Button>
            )}
          </div>
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

/** Compact horizontal stepper. Completed steps are clickable; the current
 *  one is highlighted. Scrolls horizontally on narrow screens rather than
 *  wrapping into a tall block. */
function Stepper({
  steps,
  current,
  onSelect,
}: {
  steps: readonly { id: string; title: string; hint: string }[];
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <nav aria-label="Progress" className="-mx-1 overflow-x-auto px-1">
      <ol className="flex min-w-max items-center gap-1.5">
        {steps.map((s, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <li key={s.id} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-2.5 rounded-full px-3.5 py-2 text-left transition-colors ${
                  active
                    ? "bg-[#3E4A3A] text-white"
                    : done
                      ? "text-[#23211C] hover:bg-[hsl(38_30%_93%)]"
                      : "text-[#857B6C] hover:bg-[hsl(38_30%_93%)]"
                }`}
              >
                <span
                  className={`admin-step-num inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] ${
                    active
                      ? "bg-white/15 text-white"
                      : done
                        ? "bg-[#3E4A3A] text-white"
                        : "border border-[hsl(38_16%_82%)] text-[#857B6C]"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : String(i + 1).padStart(2, "0")}
                </span>
                <span className="whitespace-nowrap text-[13px] font-semibold leading-none">
                  {s.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span className="h-px w-4 shrink-0 bg-[hsl(38_16%_82%)]" aria-hidden />
              )}
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
    <section className="grid gap-6 rounded-2xl border border-[hsl(38_20%_88%)] bg-[hsl(40_44%_98%)] p-7">
      <header className="grid gap-1.5">
        <h2 className="admin-section-title">{title}</h2>
        {hint && <p className="admin-helper">{hint}</p>}
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
    <div className="grid gap-2">
      <Label htmlFor={name} className="admin-label">
        {label}
      </Label>
      {children}
      {hint && !error && <p className="admin-helper">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

/** Inline draft status shown in the sticky bar, paired with the step count. */
function DraftStatusInline({
  status,
  savedAt,
  step,
}: {
  status: "idle" | "saving" | "saved" | "error";
  savedAt: string | null;
  step: number;
}) {
  const stepLabel = (
    <span className="text-xs text-[#857B6C]">
      Step <span className="admin-numeric font-semibold text-[#23211C]">{step + 1}</span> of{" "}
      <span className="admin-numeric font-semibold">{STEPS.length}</span> · {STEPS[step].title}
    </span>
  );
  let statusEl: React.ReactNode = null;
  if (status === "saving") {
    statusEl = (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
      </span>
    );
  } else if (status === "saved") {
    statusEl = (
      <span className="flex items-center gap-1.5 text-xs text-emerald-700">
        <Check className="h-3.5 w-3.5" /> Saved
        {savedAt && (
          <span className="text-muted-foreground">{new Date(savedAt).toLocaleTimeString()}</span>
        )}
      </span>
    );
  } else if (status === "error") {
    statusEl = (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" /> Draft not saved
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2 truncate">
      {stepLabel}
      {statusEl && <span className="hidden sm:inline-block">·</span>}
      {statusEl}
    </span>
  );
}

/** Read-only summary shown on the final step. Values come from a form
 *  snapshot taken on entering the step; each block links back to its
 *  section for quick edits. */
function ReviewPane({
  review,
  propertyType,
  state,
  city,
  locality,
  policyPreset,
  onEdit,
}: {
  review: Partial<AddVillaValues> | null;
  propertyType: PropertyType;
  state: string;
  city: string;
  locality: string;
  policyPreset: string;
  onEdit: (i: number) => void;
}) {
  const r = review ?? {};
  const images = (r.images ?? []) as { src: string; alt: string }[];
  const locBits = [locality, city, state].filter(Boolean).join(", ");
  const amenityCount =
    ((r.amenities as string[] | undefined)?.length ?? 0) +
    ((r.facilities as string[] | undefined)?.length ?? 0);
  const price = r.pricePerNight ? `₹${Number(r.pricePerNight).toLocaleString("en-IN")}` : "—";

  return (
    <Section title="Review before publishing" hint="Give everything a final check. Click any section to edit.">
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard title="Property" onEdit={() => onEdit(0)}>
          <SummaryRow label="Name" value={r.name || "—"} />
          <SummaryRow label="Type" value={<span className="capitalize">{propertyType}</span>} />
          <SummaryRow label="Guests" value={r.maxGuests || "—"} />
          <SummaryRow label="Bedrooms" value={r.bedrooms || "—"} />
          <SummaryRow label="Bathrooms" value={r.bathrooms || "—"} />
        </SummaryCard>

        <SummaryCard title="Location" onEdit={() => onEdit(1)}>
          <SummaryRow label="Where" value={locBits || "—"} />
          <SummaryRow
            label="Coordinates"
            value={r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : "Not set"}
          />
        </SummaryCard>

        <SummaryCard title="Pricing" onEdit={() => onEdit(4)}>
          <SummaryRow label="Price / night" value={price} />
          <SummaryRow label="Rating" value={r.rating || "—"} />
          <SummaryRow label="Featured" value={r.featured ? "Yes" : "No"} />
        </SummaryCard>

        <SummaryCard title="Policies" onEdit={() => onEdit(5)}>
          <SummaryRow label="Amenities" value={`${amenityCount} selected`} />
          <SummaryRow label="Meals" value={r.mealsPreset ? String(r.mealsPreset) : "Not set"} />
          <SummaryRow label="Cancellation" value={policyPreset || "Not set"} />
        </SummaryCard>
      </div>

      <div className="grid gap-2.5">
        <div className="flex items-center justify-between">
          <p className="admin-label">Photos · {images.length}</p>
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        </div>
        {images.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {images.slice(0, 8).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img.src}
                alt={img.alt}
                className={`h-16 w-24 rounded-lg object-cover ${
                  i === 0 ? "ring-2 ring-primary ring-offset-2 ring-offset-[hsl(40_44%_98%)]" : ""
                }`}
              />
            ))}
          </div>
        ) : (
          <p className="admin-helper">No photos added yet — at least one is required to publish.</p>
        )}
        {images.length > 0 && (
          <p className="admin-helper">The highlighted image is the cover photo.</p>
        )}
      </div>
    </Section>
  );
}

function SummaryCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-[hsl(38_20%_88%)] bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="admin-label">{title}</p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>
      <dl className="grid gap-1.5">{children}</dl>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
