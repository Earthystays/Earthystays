import Link from "next/link";
import { getAllDestinations } from "@/lib/data/locations";
import { getAllCollections } from "@/lib/data/collections";
import { getAllExperiences } from "@/lib/data/experiences";
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
    <div className="max-w-[1180px]">
      <header>
        <Link
          href="/admin/villas"
          className="admin-eyebrow inline-flex items-center gap-1 text-[#857B6C] transition-colors hover:text-[#23211C]"
        >
          ← Back to properties
        </Link>
        <h1 className="admin-page-title mt-4">Add new property</h1>
        <p className="admin-subtitle mt-3 max-w-xl">
          Add the property details, photos, pricing and booking information. Your progress
          auto-saves to Drafts as you go.
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
      />
    </div>
  );
}
