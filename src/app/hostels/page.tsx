import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
  // The destination filter now has a real URL. Send the legacy ?state= form
  // there so old links and bookmarks land on the canonical page.
  const stateFilter = typeof sp.state === "string" ? sp.state : undefined;
  if (stateFilter) redirect(`/hostels/${encodeURIComponent(stateFilter)}`);
  return <PropertyBrowseIndex kind="hostel" />;
}
