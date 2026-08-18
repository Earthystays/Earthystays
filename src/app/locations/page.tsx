import type { Metadata } from "next";
import { getAllDestinations } from "@/lib/data/locations";
import { getVillasByDestination } from "@/lib/data/villas";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DestinationsEditorial } from "@/components/destinations-editorial";

export const metadata: Metadata = {
  title: "Explore Destinations — Villas & Stays Across India | Earthy Stays",
  description:
    "From Goa's beaches to Himachal's hills — explore handpicked villas and apartments by state and city, all vetted for quality and comfort.",
};

export default function LocationsPage() {
  const destinations = getAllDestinations()
    .map((d) => ({ ...d, count: getVillasByDestination(d.slug).length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return (
    <div>
      <div className="container-page pt-8 lg:pt-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Locations" }]} />
      </div>
      <DestinationsEditorial destinations={destinations} />
    </div>
  );
}
