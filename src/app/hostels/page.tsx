import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHostels } from "@/lib/data/villas";
import { PropertyBrowseIndex } from "@/components/property-browse-index";

export const metadata: Metadata = {
  title: "Hostels in India | Earthy Stays",
  description:
    "Social, well-run hostels — mixed and female dorms, private dorms, and individual beds. Browse by destination and inquire in minutes.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HostelsIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Keep the section invisible until the first hostel is live.
  if (getHostels().length === 0) notFound();
  const sp = await searchParams;
  const stateFilter = typeof sp.state === "string" ? sp.state : undefined;
  return <PropertyBrowseIndex kind="hostel" stateFilter={stateFilter} />;
}
