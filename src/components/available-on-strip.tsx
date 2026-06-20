import Image from "next/image";

/** Static "Find us on all your favorite platforms" strip. Drop more
 *  PNG/SVG files into public/brand/partners/ and add an entry below to
 *  surface another OTA. Files render at a max height of ~48px, full
 *  colour, with subtle hover. */
const PARTNERS: Array<{ name: string; file: string }> = [
  { name: "Airbnb", file: "/brand/partners/airbnb.png" },
  { name: "MakeMyTrip", file: "/brand/partners/makemytrip.png" },
  { name: "Booking.com", file: "/brand/partners/booking.png" },
  { name: "Agoda", file: "/brand/partners/agoda.png" },
];

export function AvailableOnStrip() {
  if (PARTNERS.length === 0) return null;

  return (
    <section className="border-y border-border/40 bg-background py-12 sm:py-14">
      <div className="container-page">
        <h2 className="text-center font-display text-xl text-foreground sm:text-2xl">
          Find us on all your favorite platforms!
        </h2>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14 sm:gap-y-8">
          {PARTNERS.map((p) => (
            <li key={p.name} className="shrink-0">
              <Image
                src={p.file}
                alt={p.name}
                width={160}
                height={48}
                className="h-9 w-auto object-contain opacity-90 transition-opacity hover:opacity-100 sm:h-10"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
