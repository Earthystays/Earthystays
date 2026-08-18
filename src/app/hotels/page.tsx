import type { Metadata } from "next";
import { PropertyBrowseIndex } from "@/components/property-browse-index";

export const metadata: Metadata = {
  title: "Hotels in India | Earthy Stays",
  description:
    "Handpicked hotels across Goa and beyond — deluxe rooms to premium suites, with clear pricing and dedicated support. Browse by destination and inquire in minutes.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HotelsIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const stateFilter = typeof sp.state === "string" ? sp.state : undefined;
  return <PropertyBrowseIndex kind="hotel" stateFilter={stateFilter} />;
}
