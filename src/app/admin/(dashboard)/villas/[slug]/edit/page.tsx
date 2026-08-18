import Link from "next/link";
import { notFound } from "next/navigation";
import { getVillaBySlugWithHidden } from "@/lib/data/villas";
import { getAllDestinations } from "@/lib/data/locations";
import { getAllCollections } from "@/lib/data/collections";
import { getAllExperiences } from "@/lib/data/experiences";
import { INDIAN_STATES } from "@/lib/india-states";
import {
  VILLA_AMENITIES,
  VILLA_FACILITIES,
  CANCELLATION_PRESETS,
  MEAL_PRESETS,
} from "../../new/constants";
import { NewVillaForm } from "../../new/form";
import { villaToFormValues } from "../../villa-to-values";
import { UnitsEditor } from "./units-editor";
import { getBlockedDatesForProperty } from "@/lib/data/unit-blocked-dates";
import { getRatesForProperty } from "@/lib/data/unit-rates";
import { getCustomAmenityNames, getCustomFacilityNames } from "@/lib/data/amenities-store";
import { getAmenityIconName } from "@/lib/amenity-icons";

const withIcon = (name: string) => ({ name, iconName: getAmenityIconName(name) });

export const metadata = { title: "Edit villa" };

type PageProps = { params: Promise<{ slug: string }> };

export default async function EditVillaPage({ params }: PageProps) {
  const { slug } = await params;
  const villa = getVillaBySlugWithHidden(slug);
  if (!villa) notFound();

  const customA = getCustomAmenityNames();
  const customF = getCustomFacilityNames();
  const initialValues = villaToFormValues(villa, customA, customF);

  return (
    <div className="max-w-3xl">
      <header>
        <Link href="/admin/villas" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to villas
        </Link>
        <h1 className="mt-3 font-display text-4xl">Edit {villa.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Save to publish your changes. To rename the URL, change the slug — the old slug will redirect through the seed if present.
        </p>
      </header>

      <NewVillaForm
        destinations={getAllDestinations().map((d) => ({
          slug: d.slug,
          name: d.name,
          cities: d.cities.map((c) => ({
            slug: c.slug,
            name: c.name,
            locations: (c.locations ?? []).map((l) => ({
              slug: l.slug,
              name: l.name,
            })),
          })),
        }))}
        collections={getAllCollections().map((c) => ({ slug: c.slug, name: c.name }))}
        experienceOptions={getAllExperiences().map((e) => ({
          slug: e.slug,
          name: e.name,
          blurb: e.blurb,
        }))}
        amenities={[...VILLA_AMENITIES, ...customA].map(withIcon)}
        facilities={[...VILLA_FACILITIES, ...customF].map(withIcon)}
        states={[...INDIAN_STATES]}
        cancellationPresets={CANCELLATION_PRESETS.map((p) => ({ ...p }))}
        mealPresets={MEAL_PRESETS.map((p) => ({ ...p }))}
        initialState={{ ok: false, values: initialValues }}
      />

      {(villa.type === "hotel" || villa.type === "hostel") && (
        <UnitsEditor
          slug={villa.slug}
          type={villa.type}
          initialUnits={villa.units ?? []}
          initialBlockedDates={await getBlockedDatesForProperty(villa.slug)}
          initialRates={await getRatesForProperty(villa.slug)}
        />
      )}
    </div>
  );
}
