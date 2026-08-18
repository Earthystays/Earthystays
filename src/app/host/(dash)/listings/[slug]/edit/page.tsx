import { notFound } from "next/navigation";
import { requireHost } from "@/lib/host-auth";
import { getVillaBySlugWithHidden } from "@/lib/data/villas";
import { getAllDestinations } from "@/lib/data/locations";
import { getCustomAmenityNames } from "@/lib/data/amenities-store";
import { VILLA_AMENITIES } from "@/app/admin/(dashboard)/villas/new/constants";
import { ListingWizard } from "@/components/host/listing-wizard";
import type { WizardValues } from "@/components/host/listing-wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit listing · Hosting" };

type PageProps = { params: Promise<{ slug: string }> };

/** Best-effort parse of the stored house-rule strings back into the
 *  wizard's structured fields (they were composed by the wizard). */
function parseRules(rules: string[]) {
  const joined = rules.join(" · ").toLowerCase();
  const checkIn = /check-in after ([^,·]+)/.exec(joined)?.[1]?.trim();
  const checkOut = /check-out before ([^,·]+)/.exec(joined)?.[1]?.trim();
  return {
    checkIn: checkIn ?? "2:00 pm",
    checkOut: checkOut ?? "11:00 am",
    petsAllowed: joined.includes("pets are welcome"),
    smokingAllowed: joined.includes("smoking allowed"),
    partiesAllowed: joined.includes("events allowed"),
  };
}

export default async function EditListingPage({ params }: PageProps) {
  const user = await requireHost();
  const { slug } = await params;
  const villa = getVillaBySlugWithHidden(slug);
  if (!villa || villa.hostId !== user.id) notFound();

  const initial: Partial<WizardValues> = {
    type: villa.type ?? "villa",
    name: villa.name,
    tagline: villa.tagline,
    description: villa.description,
    destinationSlug: villa.destinationSlug,
    city: villa.city ?? "",
    locationNote: villa.locationNote,
    maxGuests: villa.maxGuests,
    bedrooms: villa.bedrooms,
    bathrooms: villa.bathrooms,
    amenities: villa.amenities,
    images: villa.images,
    pricePerNight: villa.pricePerNight,
    minNights: villa.minNights ?? 1,
    latitude: villa.latitude,
    longitude: villa.longitude,
    ...parseRules(villa.houseRules),
  };

  return (
    <div>
      {villa.status === "rejected" && villa.rejectedReason && (
        <div className="mx-auto mt-6 max-w-2xl px-5">
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            <p className="font-medium">Changes requested by the Earthy Stays team</p>
            <p className="mt-1">{villa.rejectedReason}</p>
          </div>
        </div>
      )}
      <ListingWizard
        destinations={getAllDestinations().map((d) => ({
          slug: d.slug,
          name: d.name,
          cities: d.cities.map((c) => c.name),
        }))}
        amenityOptions={[...VILLA_AMENITIES, ...getCustomAmenityNames()]}
        initial={initial}
        editingSlug={villa.slug}
      />
    </div>
  );
}
