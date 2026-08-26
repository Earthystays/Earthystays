import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass, Luggage } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getTripsForUser } from "@/lib/trips/store";
import { TripCard } from "@/components/trips/trip-card";
import type { Trip } from "@/lib/trips/types";

export const metadata: Metadata = {
  title: "My Trips",
  description: "Your upcoming and past stays and experiences with Earthy Stays.",
  // A signed-in-only dashboard has nothing to offer a crawler.
  robots: { index: false, follow: false },
};

// Bookings change per request and per guest — never cache this.
export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/trips");

  const { upcoming, past, cancelled, availability } = await getTripsForUser(user.id);
  const isEmpty =
    upcoming.length === 0 && past.length === 0 && cancelled.length === 0;

  return (
    <div className="container-page !max-w-5xl py-12 sm:py-16">
      <header className="grid gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Earthy Stays
        </p>
        <h1 className="font-title text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          My Trips
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Everything you have booked with us — where you&apos;re going, what
          you&apos;ve planned, and where you&apos;ve been.
        </p>
      </header>

      {isEmpty ? (
        <EmptyState availability={availability} />
      ) : (
        <div className="mt-12 grid gap-14">
          <TripSection
            title="Upcoming trips"
            sub="Your confirmed travel, soonest first"
            trips={upcoming}
            emptyNote="No upcoming trips yet."
          />
          {past.length > 0 && (
            <TripSection title="Past trips" sub="Where you've stayed" trips={past} />
          )}
          {cancelled.length > 0 && (
            <TripSection
              title="Cancelled"
              sub="Bookings that didn't go ahead"
              trips={cancelled}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TripSection({
  title,
  sub,
  trips,
  emptyNote,
}: {
  title: string;
  sub?: string;
  trips: Trip[];
  emptyNote?: string;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}

      {trips.length === 0 ? (
        emptyNote ? (
          <p className="mt-5 rounded-xl border border-dashed border-border/70 bg-card/40 px-5 py-6 text-sm text-muted-foreground">
            {emptyNote}
          </p>
        ) : null
      ) : (
        <div className="mt-5 grid gap-5">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Two genuinely different empty states. "We can't reach the booking system"
 * must never be dressed up as "you have no trips" — a guest with a real
 * booking would rightly panic.
 */
function EmptyState({ availability }: { availability: "ok" | "unavailable" }) {
  if (availability === "unavailable") {
    return (
      <div className="mt-12 rounded-2xl border border-border/60 bg-card p-10 text-center">
        <Luggage
          className="mx-auto h-8 w-8 text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h2 className="mt-4 font-display text-xl font-bold text-foreground">
          Your trips aren&apos;t available right now
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          We couldn&apos;t load your bookings. This is on our side, not yours —
          nothing has changed about any booking you&apos;ve made. Please try
          again shortly, or contact us and we&apos;ll confirm your plans
          directly.
        </p>
        <Link
          href="/partner"
          className="mt-6 inline-flex rounded-full border border-foreground/80 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Contact us
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-12 rounded-2xl border border-border/60 bg-card p-10 text-center">
      <Compass
        className="mx-auto h-8 w-8 text-terracotta"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h2 className="mt-4 font-display text-xl font-bold text-foreground">
        No trips yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Once you book a stay or an experience with us, it will appear here with
        your dates, your host&apos;s details and your day-by-day plan.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/villas"
          className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse stays
        </Link>
        <Link
          href="/experiences"
          className="inline-flex rounded-full border border-foreground/80 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Explore experiences
        </Link>
      </div>
    </div>
  );
}
