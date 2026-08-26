import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getHotels } from "@/lib/data/villas";
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
  // Keep the section invisible until the first hotel is live.
  if (getHotels().length === 0) notFound();
  const sp = await searchParams;
  // The destination filter now has a real URL. Send the legacy ?state= form
  // there so old links and bookmarks land on the canonical page.
  const stateFilter = typeof sp.state === "string" ? sp.state : undefined;
  if (stateFilter) redirect(`/hotels/${encodeURIComponent(stateFilter)}`);
  return <PropertyBrowseIndex kind="hotel" />;
}
