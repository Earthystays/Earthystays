import type { Metadata } from "next";
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
  const sp = await searchParams;
  const stateFilter = typeof sp.state === "string" ? sp.state : undefined;
  return <PropertyBrowseIndex kind="hostel" stateFilter={stateFilter} />;
}
