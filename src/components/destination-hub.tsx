import Link from "next/link";
import { BookOpen, Compass, Home } from "lucide-react";
import { getVillasByDestination, getVillasByCollection } from "@/lib/data/villas";
import { getAllCollections } from "@/lib/data/collections";
import { getPublishedExperiences } from "@/lib/data/experiences";
import { getPublishedArticles } from "@/lib/data/journal";
import { getEnabledJournalDestinations } from "@/lib/data/journal-destinations";

/**
 * The destination hub: Stay → Explore → Read.
 *
 * Every link is backed by a real count computed from live data. A section with
 * nothing behind it is omitted entirely, and the whole block disappears when a
 * destination has nothing to connect — so this never manufactures navigation
 * into empty pages.
 */

type HubLink = { label: string; href: string; count: number };

function stayLinks(stateSlug: string): HubLink[] {
  const here = getVillasByDestination(stateSlug);
  const count = (type: string) =>
    here.filter((v) => (v.type ?? "villa") === type).length;

  return [
    { label: "Villas", href: `/villas?state=${stateSlug}`, count: count("villa") },
    {
      label: "Apartments",
      href: `/apartments?state=${stateSlug}`,
      count: count("apartment"),
    },
    { label: "Hotels", href: `/hotels/${stateSlug}`, count: count("hotel") },
    { label: "Hostels", href: `/hostels/${stateSlug}`, count: count("hostel") },
  ].filter((l) => l.count > 0);
}

function exploreLinks(stateSlug: string): HubLink[] {
  const links: HubLink[] = [];

  const experiences = getPublishedExperiences().filter(
    (e) => e.citySlug === stateSlug,
  );
  if (experiences.length > 0) {
    links.push({
      label: "Experiences",
      href: `/experiences/${stateSlug}`,
      count: experiences.length,
    });
  }

  // Only collections that actually hold a property in this destination.
  const relevantCollections = getAllCollections().filter((c) =>
    getVillasByCollection(c.slug).some((v) => v.destinationSlug === stateSlug),
  );
  if (relevantCollections.length > 0) {
    links.push({
      label: "Collections",
      href: "/collections",
      count: relevantCollections.length,
    });
  }

  return links;
}

function readLinks(stateName: string): HubLink[] {
  // Journal destinations are town-level and carry a `location` like
  // "North Goa" — the only link back to a state, so match on that.
  const townSlugs = new Set(
    getEnabledJournalDestinations()
      .filter((d) =>
        d.location?.toLowerCase().includes(stateName.toLowerCase()),
      )
      .map((d) => d.slug),
  );
  if (townSlugs.size === 0) return [];

  const articles = getPublishedArticles().filter(
    (a) => a.destinationSlug && townSlugs.has(a.destinationSlug),
  );
  if (articles.length === 0) return [];

  return [
    {
      label: `${stateName} Journal`,
      href: "/journal",
      count: articles.length,
    },
  ];
}

export function DestinationHub({
  stateSlug,
  stateName,
}: {
  stateSlug: string;
  stateName: string;
}) {
  const groups = [
    { title: "Stay", icon: Home, links: stayLinks(stateSlug) },
    { title: "Explore", icon: Compass, links: exploreLinks(stateSlug) },
    { title: "Read", icon: BookOpen, links: readLinks(stateName) },
  ].filter((g) => g.links.length > 0);

  if (groups.length === 0) return null;

  return (
    <section
      aria-labelledby="destination-hub-heading"
      className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8"
    >
      <h2
        id="destination-hub-heading"
        className="font-display text-2xl font-bold tracking-tight text-foreground"
      >
        Everything in {stateName}
      </h2>

      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ title, icon: Icon, links }) => (
          <div key={title}>
            <h3 className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
              {title}
            </h3>
            <ul className="mt-3 grid gap-1">
              {links.map((l) => (
                <li key={l.href + l.label}>
                  <Link
                    href={l.href}
                    className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sand/50"
                  >
                    <span className="text-sm font-medium text-foreground group-hover:text-terracotta">
                      {l.label}
                    </span>
                    <span className="font-numeric text-xs tabular-nums text-muted-foreground">
                      {l.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
