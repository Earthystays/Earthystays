import { requireHost } from "@/lib/host-auth";
import { getAllDestinations } from "@/lib/data/locations";
import { getCustomAmenityNames } from "@/lib/data/amenities-store";
import { VILLA_AMENITIES } from "@/app/admin/(dashboard)/villas/new/constants";
import { ListingWizard } from "@/components/host/listing-wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "New listing · Hosting" };

export default async function NewListingPage() {
  await requireHost();
  return (
    <ListingWizard
      destinations={getAllDestinations().map((d) => ({
        slug: d.slug,
        name: d.name,
        cities: d.cities.map((c) => c.name),
      }))}
      amenityOptions={[...VILLA_AMENITIES, ...getCustomAmenityNames()]}
    />
  );
}
