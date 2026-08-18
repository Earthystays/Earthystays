"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Loader2, Home, Building2, ChevronRight, MapPin, Check, X, LocateFixed } from "lucide-react";
import { PhotoUploader, type UploadedPhoto } from "@/components/photo-uploader";
import { saveListing, resolveMapLink, type WizardPayload } from "@/app/host/(dash)/listings/wizard-actions";
import { parseCoords, isShortMapLink } from "@/lib/geo/parse-coords";

type DestinationOpt = { slug: string; name: string; cities: string[] };

const MIN_PHOTOS = 3;

export type WizardValues = WizardPayload;

const STEP_LABELS = [
  "Property type",
  "Location",
  "Basics",
  "Amenities",
  "Photos",
  "Title",
  "Description",
  "Pricing",
  "House rules",
  "Review",
];

export function ListingWizard({
  destinations,
  amenityOptions,
  initial,
  editingSlug,
}: {
  destinations: DestinationOpt[];
  amenityOptions: string[];
  initial?: Partial<WizardValues>;
  editingSlug?: string;
}) {
  const router = useRouter();
  // Editing an existing listing opens on the summary (last step) with
  // jump-links into each section — walking the 10-step create flow again
  // would read as "make a new listing".
  const editMode = !!editingSlug;
  const REVIEW_STEP = STEP_LABELS.length - 1;
  const [step, setStep] = useState(editMode ? REVIEW_STEP : 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [v, setV] = useState<WizardValues>({
    type: initial?.type ?? "villa",
    name: initial?.name ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    destinationSlug: initial?.destinationSlug ?? "",
    city: initial?.city ?? "",
    locationNote: initial?.locationNote ?? "",
    maxGuests: initial?.maxGuests ?? 4,
    bedrooms: initial?.bedrooms ?? 2,
    bathrooms: initial?.bathrooms ?? 2,
    amenities: initial?.amenities ?? [],
    images: initial?.images ?? [],
    pricePerNight: initial?.pricePerNight ?? 15000,
    minNights: initial?.minNights ?? 1,
    checkIn: initial?.checkIn ?? "2:00 pm",
    checkOut: initial?.checkOut ?? "11:00 am",
    petsAllowed: initial?.petsAllowed ?? false,
    smokingAllowed: initial?.smokingAllowed ?? false,
    partiesAllowed: initial?.partiesAllowed ?? false,
    latitude: initial?.latitude,
    longitude: initial?.longitude,
  });

  // Local-only state for the "pin the exact spot" field — what the host typed,
  // whether we're resolving a short link, and any parse error to surface.
  const [pinInput, setPinInput] = useState("");
  const [pinResolving, setPinResolving] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  function setCoords(lat: number, lng: number) {
    patch("latitude", lat);
    patch("longitude", lng);
    setPinError(null);
  }

  /** Drop the pin on the host's current GPS position — handy when they're
   *  filling this in from the property itself. Needs their permission. */
  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPinError("Your browser can't share a location. Paste a map link instead.");
      return;
    }
    setPinError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCoords(
          Number(pos.coords.latitude.toFixed(6)),
          Number(pos.coords.longitude.toFixed(6)),
        );
      },
      (err) => {
        setLocating(false);
        setPinError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Paste a map link or coordinates instead."
            : "Couldn't get your location. Paste a map link or coordinates instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  function clearCoords() {
    patch("latitude", undefined);
    patch("longitude", undefined);
    setPinInput("");
    setPinError(null);
  }

  /** Parse whatever the host pasted. Plain coords and full Maps URLs resolve
   *  instantly on the client; short share links go to the server to expand. */
  async function applyPin() {
    const text = pinInput.trim();
    if (!text) return;
    setPinError(null);

    const direct = parseCoords(text);
    if (direct) {
      setCoords(direct.lat, direct.lng);
      return;
    }
    if (isShortMapLink(text)) {
      setPinResolving(true);
      const res = await resolveMapLink(text);
      setPinResolving(false);
      if (res.ok) setCoords(res.coords.lat, res.coords.lng);
      else setPinError(res.error);
      return;
    }
    setPinError(
      "Paste a Google Maps link or coordinates like 15.5187, 73.7629.",
    );
  }

  function patch<K extends keyof WizardValues>(key: K, value: WizardValues[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  const selectedDest = destinations.find((d) => d.slug === v.destinationSlug);

  /** Light per-step gate so "Next" nudges instead of failing at the end. */
  function stepReady(): boolean {
    switch (step) {
      case 1: return !!v.destinationSlug && !!v.city;
      case 4: return v.images.length >= MIN_PHOTOS;
      case 5: return v.name.trim().length >= 3;
      case 6: return v.description.trim().length >= 20;
      case 7: return v.pricePerNight >= 1000;
      default: return true;
    }
  }

  /** Navigating between steps drops any stale submit error — it refers to
   *  the state at the moment of the failed submit, not the current one. */
  function goToStep(next: number) {
    setError(null);
    setStep(next);
  }

  function save(mode: "draft" | "submit") {
    setError(null);
    startTransition(async () => {
      const res = await saveListing(v, mode, editingSlug);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong");
        return;
      }
      router.push(
        mode === "submit"
          ? "/host/listings?submitted=" + encodeURIComponent(res.slug ?? "")
          : "/host/listings?saved=1",
      );
    });
  }

  const pct = ((step + 1) / STEP_LABELS.length) * 100;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-2xl flex-col px-5 pb-28 pt-10">
      {/* progress */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between text-sm text-muted-foreground">
          <span>
            {editMode
              ? `Editing · ${STEP_LABELS[step]}`
              : `Step ${step + 1} of ${STEP_LABELS.length} · ${STEP_LABELS[step]}`}
          </span>
          <button
            type="button"
            onClick={() => save("draft")}
            disabled={pending}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50"
          >
            Save &amp; exit
          </button>
        </div>
        {!editMode && (
          <div className="mt-3 h-1 w-full rounded-full bg-muted">
            <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex-1">
        {/* 0 · TYPE */}
        {step === 0 && (
          <StepShell title="What are you listing?" sub="Pick the closest match — guests browse villas and apartments separately.">
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                { value: "villa", label: "Villa", desc: "An entire private home — pool villas, bungalows, farmhouses.", icon: Home },
                { value: "apartment", label: "Apartment", desc: "A flat, penthouse or serviced apartment in a building.", icon: Building2 },
              ] as const).map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => patch("type", t.value)}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    v.type === t.value
                      ? "border-foreground bg-muted/40"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  <t.icon className="h-6 w-6 text-foreground/80" strokeWidth={1.6} />
                  <p className="mt-3 font-medium">{t.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {/* 1 · LOCATION */}
        {step === 1 && (
          <StepShell title="Where's your place?" sub="Guests only see the area until they book — never your exact address.">
            <div className="grid gap-5">
              <Labeled label="State">
                <select
                  value={v.destinationSlug}
                  onChange={(e) => { patch("destinationSlug", e.target.value); patch("city", ""); }}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-[15px]"
                >
                  <option value="" disabled>Choose state…</option>
                  {destinations.map((d) => (
                    <option key={d.slug} value={d.slug}>{d.name}</option>
                  ))}
                </select>
              </Labeled>
              <Labeled label="City / region" hint="Some areas are grouped by region, e.g. North Goa.">
                {selectedDest && selectedDest.cities.length > 0 ? (
                  <select
                    value={selectedDest.cities.includes(v.city) ? v.city : v.city ? "__other" : ""}
                    onChange={(e) => patch("city", e.target.value === "__other" ? " " : e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-[15px]"
                  >
                    <option value="" disabled>Choose city or region…</option>
                    {selectedDest.cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__other">Other…</option>
                  </select>
                ) : (
                  <input
                    value={v.city}
                    onChange={(e) => patch("city", e.target.value)}
                    placeholder="e.g. Candolim"
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-[15px]"
                  />
                )}
              </Labeled>
              {selectedDest && selectedDest.cities.length > 0 && v.city && !selectedDest.cities.includes(v.city) && (
                <Labeled label="City name">
                  <input
                    value={v.city.trim()}
                    onChange={(e) => patch("city", e.target.value || " ")}
                    placeholder="Type your city"
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-[15px]"
                  />
                </Labeled>
              )}
              <Labeled label="Area / landmark" hint="Shown on your listing, e.g. “Anjuna, 2 min from Ozran Beach”.">
                <input
                  value={v.locationNote}
                  onChange={(e) => patch("locationNote", e.target.value)}
                  placeholder="e.g. Anna Vaddo, Candolim"
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-[15px]"
                />
              </Labeled>

              <Labeled
                label="Pin the exact spot"
                hint="Guests see this as a map. Your address stays private until they book."
              >
                {typeof v.latitude === "number" && typeof v.longitude === "number" ? (
                  <div className="overflow-hidden rounded-xl border border-border/60">
                    <iframe
                      title="Selected location"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${v.longitude - 0.01}%2C${v.latitude - 0.01}%2C${v.longitude + 0.01}%2C${v.latitude + 0.01}&layer=mapnik&marker=${v.latitude}%2C${v.longitude}`}
                      className="aspect-[16/9] w-full"
                      loading="lazy"
                    />
                    <div className="flex items-center justify-between gap-3 bg-muted/40 px-4 py-2.5 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        Pinned · {v.latitude.toFixed(5)}, {v.longitude.toFixed(5)}
                      </span>
                      <button
                        type="button"
                        onClick={clearCoords}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" /> Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={pinInput}
                          onChange={(e) => { setPinInput(e.target.value); setPinError(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPin(); } }}
                          placeholder="Paste Google Maps link or 15.5187, 73.7629"
                          className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyPin}
                        disabled={pinResolving || !pinInput.trim()}
                        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                      >
                        {pinResolving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Set pin
                      </button>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="h-px flex-1 bg-border" />
                      or
                      <span className="h-px flex-1 bg-border" />
                    </div>
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locating}
                      className="mt-2.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted/50 disabled:opacity-60"
                    >
                      {locating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LocateFixed className="h-4 w-4" />
                      )}
                      {locating ? "Getting your location…" : "Use my current location"}
                    </button>
                    {pinError ? (
                      <p className="mt-1.5 text-xs text-red-600">{pinError}</p>
                    ) : (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        In Google Maps, drop a pin → Share → Copy link, or right-click the
                        spot to copy its coordinates.
                      </p>
                    )}
                  </>
                )}
              </Labeled>
            </div>
          </StepShell>
        )}

        {/* 2 · BASICS */}
        {step === 2 && (
          <StepShell title="Share some basics" sub="You can fine-tune these anytime.">
            <div className="divide-y divide-border rounded-xl border border-border">
              <Stepper label="Guests" value={v.maxGuests} min={1} max={40} onChange={(n) => patch("maxGuests", n)} />
              <Stepper label="Bedrooms" value={v.bedrooms} min={1} max={20} onChange={(n) => patch("bedrooms", n)} />
              <Stepper label="Bathrooms" value={v.bathrooms} min={1} max={20} onChange={(n) => patch("bathrooms", n)} />
            </div>
          </StepShell>
        )}

        {/* 3 · AMENITIES */}
        {step === 3 && (
          <StepShell title="What does your place offer?" sub="Select everything that applies — you can add more later.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {amenityOptions.map((a) => {
                const on = v.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      patch(
                        "amenities",
                        on ? v.amenities.filter((x) => x !== a) : [...v.amenities, a],
                      )
                    }
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      on ? "border-foreground bg-muted/40 font-medium" : "border-border hover:border-foreground/40"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </StepShell>
        )}

        {/* 4 · PHOTOS */}
        {step === 4 && (
          <StepShell title="Add photos of your place" sub="You need at least 3 to submit — 10 or more gets the best results. The first photo is your cover.">
            <PhotoUploader
              name="wizard-images"
              initial={v.images}
              endpoint="/api/host/upload"
              onChange={(photos: UploadedPhoto[]) => patch("images", photos)}
            />
            <p
              className={`mt-3 text-sm ${
                v.images.length >= MIN_PHOTOS ? "text-muted-foreground" : "font-medium text-amber-700"
              }`}
            >
              {v.images.length} of {MIN_PHOTOS} minimum photos added
              {v.images.length >= MIN_PHOTOS ? " ✓" : ""}
            </p>
          </StepShell>
        )}

        {/* 5 · TITLE */}
        {step === 5 && (
          <StepShell title="Give your place a title" sub="Short and specific works best.">
            <div className="grid gap-5">
              <Labeled label="Title" hint={`${v.name.length}/60`}>
                <input
                  value={v.name}
                  maxLength={60}
                  onChange={(e) => patch("name", e.target.value)}
                  placeholder="e.g. Serene 3BR Penthouse in Candolim"
                  className="h-12 w-full rounded-lg border border-border bg-background px-3 text-[15px]"
                />
              </Labeled>
              <Labeled label="Tagline" hint={`One line under the title on your page · ${v.tagline.length}/100`}>
                <input
                  value={v.tagline}
                  maxLength={100}
                  onChange={(e) => patch("tagline", e.target.value)}
                  placeholder="e.g. Two-storey penthouse with a private plunge pool"
                  className="h-12 w-full rounded-lg border border-border bg-background px-3 text-[15px]"
                />
              </Labeled>
            </div>
          </StepShell>
        )}

        {/* 6 · DESCRIPTION */}
        {step === 6 && (
          <StepShell title="Describe your place" sub="What makes it special — the space, the view, the neighbourhood.">
            <textarea
              value={v.description}
              maxLength={1500}
              rows={9}
              onChange={(e) => patch("description", e.target.value)}
              placeholder="Tell guests what staying at your place feels like…"
              className="w-full rounded-lg border border-border bg-background p-4 text-[15px] leading-relaxed"
            />
            <p className="mt-2 text-sm text-muted-foreground">{v.description.length}/1500</p>
          </StepShell>
        )}

        {/* 7 · PRICING */}
        {step === 7 && (
          <StepShell title="Set your price" sub="This is your base nightly rate. The Earthy Stays team may suggest adjustments for your area.">
            <div className="grid gap-5">
              <Labeled label="Price per night (₹)">
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={v.pricePerNight}
                  onChange={(e) => patch("pricePerNight", Number(e.target.value))}
                  className="h-12 w-full rounded-lg border border-border bg-background px-3 text-lg font-medium"
                />
              </Labeled>
              <div className="rounded-xl border border-border">
                <Stepper label="Minimum stay (nights)" value={v.minNights} min={1} max={30} onChange={(n) => patch("minNights", n)} />
              </div>
              <p className="text-sm text-muted-foreground">
                No commission is charged in this phase — the Earthy Stays concierge confirms
                every booking with you before it's final.
              </p>
            </div>
          </StepShell>
        )}

        {/* 8 · RULES */}
        {step === 8 && (
          <StepShell title="Set your house rules" sub="Guests agree to these before requesting a stay.">
            <div className="grid gap-5">
              <div className="grid grid-cols-2 gap-4">
                <Labeled label="Check-in after">
                  <input
                    value={v.checkIn}
                    onChange={(e) => patch("checkIn", e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-[15px]"
                  />
                </Labeled>
                <Labeled label="Check-out before">
                  <input
                    value={v.checkOut}
                    onChange={(e) => patch("checkOut", e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-[15px]"
                  />
                </Labeled>
              </div>
              <div className="divide-y divide-border rounded-xl border border-border">
                <Toggle label="Pets allowed" value={v.petsAllowed} onChange={(b) => patch("petsAllowed", b)} />
                <Toggle label="Smoking allowed" value={v.smokingAllowed} onChange={(b) => patch("smokingAllowed", b)} />
                <Toggle label="Parties / events allowed" value={v.partiesAllowed} onChange={(b) => patch("partiesAllowed", b)} />
              </div>
            </div>
          </StepShell>
        )}

        {/* 9 · REVIEW */}
        {step === 9 && (
          <StepShell
            title={editMode ? "Your listing" : "Review and submit"}
            sub={
              editMode
                ? "Jump into any section to make changes, then save. Our team gives edits a quick review before they show on the site."
                : "Our team reviews every listing before it goes live — usually within 24 hours."
            }
          >
            {editMode && (
              <div className="mb-6 grid gap-2 sm:grid-cols-2">
                {STEP_LABELS.slice(0, -1).map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => goToStep(i)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-left text-sm hover:bg-muted/50"
                  >
                    <span className="font-medium">{label}</span>
                    <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                      <span className="max-w-[150px] truncate text-xs">{sectionSummary(i, v)}</span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="overflow-hidden rounded-xl border border-border">
              {v.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.images[0].src} alt={v.images[0].alt} className="h-52 w-full object-cover" />
              )}
              <div className="p-5">
                <p className="text-lg font-semibold">{v.name || "Untitled listing"}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {[v.city.trim(), selectedDest?.name].filter(Boolean).join(", ")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {v.type === "villa" ? "Villa" : "Apartment"} · {v.bedrooms} bedroom{v.bedrooms === 1 ? "" : "s"} · {v.bathrooms} bath{v.bathrooms === 1 ? "" : "s"} · up to {v.maxGuests} guests
                </p>
                <p className="mt-2 text-[15px] font-medium">₹{v.pricePerNight.toLocaleString("en-IN")} / night · min {v.minNights} night{v.minNights === 1 ? "" : "s"}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {v.amenities.length} amenities · {v.images.length} photos
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              By submitting you confirm you're authorised to list this property and agree to
              Earthy Stays reviewing and curating your listing before publication.
            </p>
          </StepShell>
        )}
      </div>

      {/* footer */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={() => goToStep(editMode ? REVIEW_STEP : Math.max(0, step - 1))}
            disabled={(editMode ? step === REVIEW_STEP : step === 0) || pending}
            className="text-sm font-medium text-foreground underline underline-offset-4 disabled:opacity-40"
          >
            Back
          </button>
          {step < STEP_LABELS.length - 1 ? (
            <button
              type="button"
              onClick={() => stepReady() && goToStep(editMode ? REVIEW_STEP : step + 1)}
              disabled={!stepReady() || pending}
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
            >
              {editMode ? "Done" : "Next"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => save("submit")}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingSlug ? "Save & resubmit for review" : "Submit for review"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** One-line current value shown on each edit-mode jump link. */
function sectionSummary(stepIdx: number, v: WizardValues): string {
  switch (stepIdx) {
    case 0: return v.type === "villa" ? "Villa" : "Apartment";
    case 1: {
      const place = v.city.trim() || "Not set";
      const pinned = typeof v.latitude === "number" && typeof v.longitude === "number";
      return pinned ? `${place} · 📍 pinned` : place;
    }
    case 2: return `${v.bedrooms} BR · ${v.bathrooms} bath · ${v.maxGuests} guests`;
    case 3: return `${v.amenities.length} selected`;
    case 4: return `${v.images.length} photo${v.images.length === 1 ? "" : "s"}`;
    case 5: return v.name.trim() || "Untitled";
    case 6: return v.description.trim() ? `${v.description.trim().length} characters` : "Empty";
    case 7: return `₹${v.pricePerNight.toLocaleString("en-IN")} / night`;
    case 8: return `Check-in ${v.checkIn}`;
    default: return "";
  }
}

function StepShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {sub && <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">{sub}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Labeled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Stepper({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-[15px]">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/70 hover:border-foreground/50 disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-[15px] font-medium">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/70 hover:border-foreground/50 disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (b: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between px-5 py-4 text-left"
    >
      <span className="text-[15px]">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted-foreground/25"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
