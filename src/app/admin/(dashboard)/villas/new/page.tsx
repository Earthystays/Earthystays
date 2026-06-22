import Link from "next/link";
import { getAllDestinations } from "@/lib/data/locations";
import { getAllCollections } from "@/lib/data/collections";
import { INDIAN_STATES } from "@/lib/india-states";
import { NewVillaForm } from "./form";
import { VILLA_AMENITIES, VILLA_FACILITIES, CANCELLATION_PRESETS, MEAL_PRESETS } from "./constants";
import { getCustomAmenityNames, getCustomFacilityNames } from "@/lib/data/amenities-store";
import { getAmenityIconName } from "@/lib/amenity-icons";

const withIcon = (name: string) => ({ name, iconName: getAmenityIconName(name) });

export default function NewVillaPage() {
  const customA = getCustomAmenityNames();
  const customF = getCustomFacilityNames();
  return (
    <div className="max-w-3xl">
      <header>
        <Link href="/admin/villas" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to villas
        </Link>
        <h1 className="mt-3 font-display text-4xl">Add a property</h1>
        <p className="mt-2 text-muted-foreground">
          New villas appear immediately on the public site. You can override an existing
          seed villa by using the same slug.
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
        amenities={[...VILLA_AMENITIES, ...customA].map(withIcon)}
        facilities={[...VILLA_FACILITIES, ...customF].map(withIcon)}
        states={[...INDIAN_STATES]}
        cancellationPresets={CANCELLATION_PRESETS.map((p) => ({ ...p }))}
        mealPresets={MEAL_PRESETS.map((p) => ({ ...p }))}
      />
    </div>
  );
}
