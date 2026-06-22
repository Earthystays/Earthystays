import Link from "next/link";
import { notFound } from "next/navigation";
import { destinations } from "@/lib/data/locations";
import { getAllCollections } from "@/lib/data/collections";
import { INDIAN_STATES } from "@/lib/india-states";
import { NewVillaForm } from "../../new/form";
import {
  VILLA_AMENITIES,
  VILLA_FACILITIES,
  CANCELLATION_PRESETS,
  MEAL_PRESETS,
} from "../../new/constants";
import type { AddVillaValues } from "../../new/actions";
import {
  getCustomAmenityNames,
  getCustomFacilityNames,
} from "@/lib/data/amenities-store";
import { getAmenityIconName } from "@/lib/amenity-icons";
import { getDraftById, deriveDraftLabel } from "@/lib/data/villa-drafts";

export const metadata = { title: "Continue draft · Admin" };
export const dynamic = "force-dynamic";

const withIcon = (name: string) => ({
  name,
  iconName: getAmenityIconName(name),
});

const EMPTY: AddVillaValues = {
  slug: "",
  propertyType: "villa",
  name: "",
  tagline: "",
  description: "",
  destinationSlug: "",
  collections: [],
  bedrooms: "",
  bathrooms: "",
  maxGuests: "",
  pricePerNight: "",
  rating: "",
  reviewCount: "",
  amenities: [],
  customAmenities: "",
  facilities: [],
  customFacilities: "",
  highlights: "",
  houseRules: "",
  locationNote: "",
  state: "",
  city: "",
  latitude: "",
  longitude: "",
  cancellationPreset: "",
  cancellationDescription: "",
  mealsPreset: "",
  mealsDescription: "",
  videoSrc: "",
  faqs: [],
  externalListings: [],
  featured: false,
  featuredRank: "",
  images: [],
};

type PageProps = { params: Promise<{ draftId: string }> };

export default async function ResumeDraftPage({ params }: PageProps) {
  const { draftId } = await params;
  const draft = await getDraftById(draftId);
  if (!draft) notFound();

  const customA = getCustomAmenityNames();
  const customF = getCustomFacilityNames();
  const label = deriveDraftLabel(draft.values);
  const initialValues: AddVillaValues = { ...EMPTY, ...draft.values };

  return (
    <div className="max-w-3xl">
      <header>
        <Link
          href="/admin/villas/drafts"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to drafts
        </Link>
        <h1 className="mt-3 font-display text-4xl">Continue: {label}</h1>
        <p className="mt-2 text-muted-foreground">
          Your last saved progress is loaded below. Keep editing — changes
          auto-save every few seconds. Publish when you&apos;re ready and the
          draft will be removed.
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
        draftId={draftId}
      />
    </div>
  );
}
