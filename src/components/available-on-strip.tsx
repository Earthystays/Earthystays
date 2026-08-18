import Image from "next/image";

/** Static "Trusted by Travellers" strip. Drop more PNG/SVG files into
 *  public/brand/partners/ and add an entry below to surface another OTA.
 *  Kept deliberately quiet — a supporting credibility note, not a hero
 *  section — so the platform logos stay minor. */
const PARTNERS: Array<{ name: string; file: string }> = [
  { name: "Airbnb", file: "/brand/partners/airbnb.png" },
  { name: "MakeMyTrip", file: "/brand/partners/Makemytrip.png" },
  { name: "Booking.com", file: "/brand/partners/Booking.png" },
  { name: "Agoda", file: "/brand/partners/Agoda.png" },
  { name: "Goibibo", file: "/brand/partners/goibibo.png" },
];

export function AvailableOnStrip() {
  if (PARTNERS.length === 0) return null;

  return (
    <section className="border-y border-border/40 bg-background py-8 sm:py-9">
      <div className="container-page">
        <h2 className="text-center font-display text-base text-foreground sm:text-lg">
          Trusted by Travellers
        </h2>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Also available on leading travel platforms.
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-10 sm:gap-y-5">
          {PARTNERS.map((p) => (
            <li key={p.name} className="shrink-0">
              <Image
                src={p.file}
                alt={p.name}
                width={160}
                height={48}
                className="h-6 w-auto object-contain opacity-70 transition-opacity hover:opacity-100 sm:h-7"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
