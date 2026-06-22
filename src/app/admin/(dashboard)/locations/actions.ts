"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import type { Destination, City } from "@/lib/types";
import { isSeedState, isSeedCity } from "@/lib/data/locations";

const FILE = "location-covers.json";
const ADMIN_FILE = "admin-locations.json";

type Covers = Record<string, string>;

type AdminLocations = {
  states?: Destination[];
  citiesByState?: Record<string, City[]>;
  deletedStates?: string[];
  deletedCities?: Record<string, string[]>;
  locationsByCity?: Record<string, Record<string, { slug: string; name: string }[]>>;
  deletedLocations?: Record<string, Record<string, string[]>>;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function revalidateLocations() {
  revalidatePath("/");
  revalidatePath("/locations");
  revalidatePath("/admin/locations");
  revalidatePath("/villas");
  revalidatePath("/apartments");
}

export async function setLocationCover(
  key: string,
  url: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!key || !url) return { ok: false, error: "Missing key or URL" };
  const covers = await readJson<Covers>(FILE, {});
  covers[key] = url;
  await writeJson(FILE, covers);
  revalidatePath("/locations");
  revalidatePath(`/locations/${key.split("/")[0]}`);
  if (key.includes("/")) revalidatePath(`/locations/${key}`);
  revalidatePath("/admin/locations");
  return { ok: true };
}

export async function clearLocationCover(
  key: string,
): Promise<{ ok: boolean; error?: string }> {
  const covers = await readJson<Covers>(FILE, {});
  delete covers[key];
  await writeJson(FILE, covers);
  revalidatePath("/locations");
  revalidatePath(`/locations/${key.split("/")[0]}`);
  if (key.includes("/")) revalidatePath(`/locations/${key}`);
  revalidatePath("/admin/locations");
  return { ok: true };
}

/* ───────── Location CRUD (states + cities) ───────── */

export async function addState(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const name = String(formData.get("name") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const blurb = String(formData.get("blurb") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageSrc = String(formData.get("imageSrc") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim() || name;

  if (name.length < 2) return { ok: false, error: "State name is required." };
  if (!region) return { ok: false, error: "Region is required." };
  if (!imageSrc)
    return { ok: false, error: "Upload a cover image for this state." };

  const slug = slugify(name);
  const admin = await readJson<AdminLocations>(ADMIN_FILE, {});
  admin.states = admin.states ?? [];

  // If admin previously deleted this slug, undelete it
  if (admin.deletedStates?.includes(slug)) {
    admin.deletedStates = admin.deletedStates.filter((s) => s !== slug);
  }

  // Don't duplicate a seed slug
  if (isSeedState(slug)) {
    return {
      ok: false,
      error: `A bundled state with the slug "${slug}" already exists.`,
    };
  }
  if (admin.states.some((s) => s.slug === slug)) {
    return { ok: false, error: `A state with the slug "${slug}" already exists.` };
  }

  admin.states.push({
    slug,
    name,
    region,
    blurb,
    description,
    image: { src: imageSrc, alt: imageAlt },
    cities: [],
  });

  await writeJson(ADMIN_FILE, admin);
  revalidateLocations();
  return { ok: true };
}

export async function deleteState(slug: string): Promise<{ ok: boolean }> {
  const admin = await readJson<AdminLocations>(ADMIN_FILE, {});

  // Admin-added states get removed from the states array
  admin.states = (admin.states ?? []).filter((s) => s.slug !== slug);
  // Seed states get added to the deletedStates list (hidden from getAllDestinations)
  if (isSeedState(slug)) {
    admin.deletedStates = Array.from(
      new Set([...(admin.deletedStates ?? []), slug]),
    );
  }
  // Also clean up any cities admin added under this state
  if (admin.citiesByState) delete admin.citiesByState[slug];

  await writeJson(ADMIN_FILE, admin);
  revalidateLocations();
  return { ok: true };
}

export async function addCity(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const stateSlug = String(formData.get("stateSlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const blurb = String(formData.get("blurb") ?? "").trim();
  const imageSrc = String(formData.get("imageSrc") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim() || name;

  if (!stateSlug) return { ok: false, error: "Pick a state first." };
  if (name.length < 2) return { ok: false, error: "City name is required." };
  if (!imageSrc)
    return { ok: false, error: "Upload a cover image for this city." };

  const slug = slugify(name);
  const admin = await readJson<AdminLocations>(ADMIN_FILE, {});
  admin.citiesByState = admin.citiesByState ?? {};
  const existing = admin.citiesByState[stateSlug] ?? [];

  if (existing.some((c) => c.slug === slug) || isSeedCity(stateSlug, slug)) {
    return {
      ok: false,
      error: `A city with the slug "${slug}" already exists in this state.`,
    };
  }

  // Un-delete this city slug if it was previously soft-deleted
  if (admin.deletedCities?.[stateSlug]?.includes(slug)) {
    admin.deletedCities[stateSlug] = admin.deletedCities[stateSlug].filter(
      (s) => s !== slug,
    );
  }

  admin.citiesByState[stateSlug] = [
    ...existing,
    {
      slug,
      name,
      blurb,
      image: { src: imageSrc, alt: imageAlt },
    },
  ];

  await writeJson(ADMIN_FILE, admin);
  revalidateLocations();
  return { ok: true };
}

export async function deleteCity(
  stateSlug: string,
  citySlug: string,
): Promise<{ ok: boolean }> {
  const admin = await readJson<AdminLocations>(ADMIN_FILE, {});

  // Admin-added cities: remove from list
  if (admin.citiesByState?.[stateSlug]) {
    admin.citiesByState[stateSlug] = admin.citiesByState[stateSlug].filter(
      (c) => c.slug !== citySlug,
    );
  }

  // Seed cities: add to deletedCities so loader hides them
  if (isSeedCity(stateSlug, citySlug)) {
    admin.deletedCities = admin.deletedCities ?? {};
    admin.deletedCities[stateSlug] = Array.from(
      new Set([...(admin.deletedCities[stateSlug] ?? []), citySlug]),
    );
  }

  // Drop locations the admin had added under this city
  if (admin.locationsByCity?.[stateSlug]) {
    delete admin.locationsByCity[stateSlug][citySlug];
  }

  await writeJson(ADMIN_FILE, admin);
  revalidateLocations();
  return { ok: true };
}

export async function addLocation(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const stateSlug = String(formData.get("stateSlug") ?? "").trim();
  const citySlug = String(formData.get("citySlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!stateSlug || !citySlug) {
    return { ok: false, error: "Pick a state and city first." };
  }
  if (name.length < 2) {
    return { ok: false, error: "Location name is required." };
  }

  const slug = slugify(name);
  const admin = await readJson<AdminLocations>(ADMIN_FILE, {});
  admin.locationsByCity = admin.locationsByCity ?? {};
  admin.locationsByCity[stateSlug] = admin.locationsByCity[stateSlug] ?? {};
  const existing = admin.locationsByCity[stateSlug][citySlug] ?? [];

  if (existing.some((l) => l.slug === slug)) {
    return {
      ok: false,
      error: `A location with the slug "${slug}" already exists here.`,
    };
  }

  // Un-delete if previously soft-deleted
  if (admin.deletedLocations?.[stateSlug]?.[citySlug]?.includes(slug)) {
    admin.deletedLocations[stateSlug][citySlug] = admin.deletedLocations[
      stateSlug
    ][citySlug].filter((s) => s !== slug);
  }

  admin.locationsByCity[stateSlug][citySlug] = [...existing, { slug, name }];

  await writeJson(ADMIN_FILE, admin);
  revalidateLocations();
  return { ok: true };
}

export async function deleteLocation(
  stateSlug: string,
  citySlug: string,
  locationSlug: string,
): Promise<{ ok: boolean }> {
  const admin = await readJson<AdminLocations>(ADMIN_FILE, {});

  // Admin-added: just remove
  if (admin.locationsByCity?.[stateSlug]?.[citySlug]) {
    admin.locationsByCity[stateSlug][citySlug] = admin.locationsByCity[
      stateSlug
    ][citySlug].filter((l) => l.slug !== locationSlug);
  }

  // Seed (i.e. defined in code) — soft-delete so the loader hides it
  admin.deletedLocations = admin.deletedLocations ?? {};
  admin.deletedLocations[stateSlug] = admin.deletedLocations[stateSlug] ?? {};
  const existing = admin.deletedLocations[stateSlug][citySlug] ?? [];
  if (!existing.includes(locationSlug)) {
    admin.deletedLocations[stateSlug][citySlug] = [...existing, locationSlug];
  }

  await writeJson(ADMIN_FILE, admin);
  revalidateLocations();
  return { ok: true };
}
