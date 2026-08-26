import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  MessageSquare,
  Navigation,
  Sparkles,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getTripForUser } from "@/lib/trips/store";
import { TripStatusBadge } from "@/components/trips/trip-status-badge";
import {
  formatDayLabel,
  formatTimeOfDay,
  formatTripRange,
} from "@/components/trips/format";
import type { Trip, TripTimelineEntry } from "@/lib/trips/types";

export const metadata: Metadata = {
  title: "Trip details",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function TripDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/trips/${encodeURIComponent(id)}`);

  // Scoped to the signed-in guest inside the store — someone else's trip id
  // is indistinguishable from one that doesn't exist.
  const trip = await getTripForUser(user.id, id);
  if (!trip) notFound();

  return (
    <div className="container-page !max-w-5xl py-10 sm:py-14">
      <Link
        href="/trips"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All trips
      </Link>

      <header className="mt-6 grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {formatTripRange(trip.start, trip.end)}
          </p>
          <TripStatusBadge status={trip.status} />
        </div>
        <h1 className="font-title text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {trip.title}
        </h1>
        {trip.subtitle && (
          <p className="text-muted-foreground">{trip.subtitle}</p>
        )}
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="grid min-w-0 gap-12">
          {trip.stay && <StaySection trip={trip} />}
          {trip.experiences.length > 0 && <ExperiencesSection trip={trip} />}
          {trip.timeline.length > 0 && <TimelineSection trip={trip} />}
        </div>

        <aside className="grid gap-5 lg:sticky lg:top-28">
          <UsefulInfo trip={trip} />
        </aside>
      </div>
    </div>
  );
}

/* ─────────────────────────── your stay ─────────────────────────── */

function StaySection({ trip }: { trip: Trip }) {
  const stay = trip.stay!;
  return (
    <section>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Your stay
      </h2>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card">
        {stay.image && (
          <div className="relative aspect-[21/9]">
            <Image
              src={stay.image.src}
              alt={stay.image.alt}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="grid gap-5 p-6">
          <div className="grid gap-1">
            <h3 className="font-title text-xl font-semibold text-foreground">
              {stay.propertyName}
            </h3>
            {(stay.city || stay.state) && (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
                {[stay.city, stay.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          <dl className="grid gap-4 sm:grid-cols-3">
            <Detail label="Check in" value={formatDayLabel(stay.checkIn)} />
            <Detail label="Check out" value={formatDayLabel(stay.checkOut)} />
            <Detail
              label="Guests"
              value={`${stay.guestsCount} ${stay.guestsCount === 1 ? "guest" : "guests"}`}
            />
          </dl>

          {stay.locationNote && (
            <p className="rounded-xl bg-sand/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {stay.locationNote}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {stay.propertyHref && (
              <Link
                href={stay.propertyHref}
                className="inline-flex rounded-full border border-foreground/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                View stay
              </Link>
            )}
            <Link
              href="/messages"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-terracotta/50"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Contact host
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

/* ─────────────────────────── experiences ─────────────────────────── */

function ExperiencesSection({ trip }: { trip: Trip }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Your experiences
      </h2>
      <ul className="mt-4 grid gap-4">
        {trip.experiences.map((exp) => {
          const time = formatTimeOfDay(exp.date);
          return (
            <li
              key={exp.bookingId}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand/70">
                <Sparkles
                  className="h-5 w-5 text-terracotta"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {exp.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDayLabel(exp.date.slice(0, 10))}
                  {time ? ` · ${time}` : ""} · {exp.guestsCount}{" "}
                  {exp.guestsCount === 1 ? "guest" : "guests"}
                </p>
              </div>
              {exp.href && (
                <Link
                  href={exp.href}
                  className="shrink-0 text-sm font-medium text-terracotta hover:underline"
                >
                  View
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─────────────────────────── timeline ─────────────────────────── */

const TIMELINE_DOT: Record<TripTimelineEntry["kind"], string> = {
  arrival: "bg-primary",
  experience: "bg-terracotta",
  free: "bg-border",
  checkout: "bg-primary",
};

function TimelineSection({ trip }: { trip: Trip }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Trip timeline
      </h2>
      <ol className="mt-5 grid gap-0">
        {trip.timeline.map((entry, i) => (
          <li key={`${entry.date}-${i}`} className="grid grid-cols-[72px_24px_1fr] gap-3">
            <span className="pt-0.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {formatDayLabel(entry.date)}
            </span>

            {/* Rail: dot plus the connector to the next entry */}
            <span className="relative flex justify-center" aria-hidden="true">
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TIMELINE_DOT[entry.kind]}`}
              />
              {i < trip.timeline.length - 1 && (
                <span className="absolute top-4 bottom-0 w-px bg-border" />
              )}
            </span>

            <div className="pb-6">
              {entry.href ? (
                <Link
                  href={entry.href}
                  className="text-sm font-medium text-foreground hover:text-terracotta"
                >
                  {entry.label}
                </Link>
              ) : (
                <p
                  className={`text-sm font-medium ${
                    entry.kind === "free" ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {entry.label}
                </p>
              )}
              {entry.detail && (
                <p className="mt-0.5 text-xs text-muted-foreground">{entry.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────────────────── sidebar ─────────────────────────── */

function UsefulInfo({ trip }: { trip: Trip }) {
  const stay = trip.stay;
  const mapsQuery = stay
    ? [stay.propertyName, stay.city, stay.state].filter(Boolean).join(", ")
    : null;

  return (
    <div className="grid gap-5 rounded-2xl border border-border/60 bg-card p-6">
      <h2 className="font-display text-lg font-bold text-foreground">
        Useful information
      </h2>

      <dl className="grid gap-4 text-sm">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Dates
          </dt>
          <dd className="mt-1 inline-flex items-center gap-1.5 text-foreground">
            <CalendarDays className="h-4 w-4 text-terracotta" aria-hidden="true" />
            {formatTripRange(trip.start, trip.end)}
          </dd>
        </div>

        {stay && (
          <>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Guests
              </dt>
              <dd className="mt-1 inline-flex items-center gap-1.5 text-foreground">
                <Users className="h-4 w-4 text-terracotta" aria-hidden="true" />
                {stay.guestsCount} {stay.guestsCount === 1 ? "guest" : "guests"}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Booking reference
              </dt>
              <dd className="mt-1 font-mono text-xs text-foreground">
                {stay.bookingNumber}
              </dd>
            </div>
          </>
        )}
      </dl>

      {mapsQuery && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-foreground/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Get directions
        </a>
      )}

      {/* Payment and cancellation are owned by the booking system — we link to
          it rather than restating amounts we don't hold here. */}
      <p className="text-xs leading-relaxed text-muted-foreground">
        For payment details, changes or cancellation, message us and our team
        will take care of it.
      </p>
    </div>
  );
}
