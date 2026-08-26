import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { Trip } from "@/lib/trips/types";
import { TripStatusBadge } from "./trip-status-badge";
import { formatTripRange } from "./format";

/**
 * A trip on the /trips index — large and visual for upcoming travel, and the
 * same card (muted) for past and cancelled trips.
 */
export function TripCard({ trip }: { trip: Trip }) {
  const cover = trip.stay?.image ?? trip.experiences[0]?.image ?? null;
  const muted = trip.status === "past" || trip.status === "cancelled";

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group grid overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:border-terracotta/40 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]"
    >
      <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[168px]">
        {cover ? (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            sizes="(min-width: 640px) 240px, 100vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
              muted ? "opacity-75 saturate-[0.85]" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-sand/60">
            <MapPin className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between gap-4 p-5 sm:p-6">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {formatTripRange(trip.start, trip.end)}
            </p>
            <TripStatusBadge status={trip.status} />
          </div>

          <h3 className="font-title text-2xl font-semibold leading-tight text-foreground">
            {trip.title}
          </h3>

          {trip.subtitle && (
            <p className="text-sm text-muted-foreground">{trip.subtitle}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {trip.stay && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {trip.stay.nights} {trip.stay.nights === 1 ? "night" : "nights"} ·{" "}
              {trip.stay.guestsCount}{" "}
              {trip.stay.guestsCount === 1 ? "guest" : "guests"}
            </span>
          )}
          {trip.experiences.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {trip.experiences.length}{" "}
              {trip.experiences.length === 1 ? "experience" : "experiences"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
