import Link from "next/link";
import { notFound } from "next/navigation";
import { getVillaBySlug } from "@/lib/data/villas";
import { destinations } from "@/lib/data/locations";
import { getAllCollections } from "@/lib/data/collections";
import { INDIAN_STATES } from "@/lib/india-states";
import {
  VILLA_AMENITIES,
  VILLA_FACILITIES,
  CANCELLATION_PRESETS,
  MEAL_PRESETS,
} from "../../new/constants";
import { NewVillaForm } from "../../new/form";
import { villaToFormValues } from "../../villa-to-values";
import { getCustomAmenityNames, getCustomFacilityNames } from "@/lib/data/amenities-store";
import { getAmenityIconName } from "@/lib/amenity-icons";

const withIcon = (name: string) => ({ name, iconName: getAmenityIconName(name) });

export const metadata = { title: "Edit villa" };

type PageProps = { params: Promise<{ slug: string }> };

export default async function EditVillaPage({ params }: PageProps) {
  const { slug } = await params;
  const villa = getVillaBySlug(slug);
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
        destinations={destinations.map((d) => ({
          slug: d.slug,
          name: d.name,
          cities: d.cities.map((c) => ({ slug: c.slug, name: c.name })),
        }))}
        collections={getAllCollections().map((c) => ({ slug: c.slug, name: c.name }))}
        amenities={[...VILLA_AMENITIES, ...customA].map(withIcon)}
        facilities={[...VILLA_FACILITIES, ...customF].map(withIcon)}
        states={[...INDIAN_STATES]}
        cancellationPresets={CANCELLATION_PRESETS.map((p) => ({ ...p }))}
        mealPresets={MEAL_PRESETS.map((p) => ({ ...p }))}
        initialState={{ ok: false, values: initialValues }}
      />
    </div>
  );
}
