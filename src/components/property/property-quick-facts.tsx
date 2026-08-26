import { Bath, BedDouble, FileText, MapPin, Users } from "lucide-react";
import type { PropertyType, Villa } from "@/lib/types";
import { getAmenityIcon } from "@/lib/amenity-icons";

const TYPE_LABEL: Record<PropertyType, string> = {
  villa: "Private villa",
  apartment: "Apartment",
  hotel: "Hotel",
  hostel: "Hostel",
};

/**
 * Amenities that are worth calling out as *the* reason to pick a place,
 * strongest first. Matched as substrings so custom admin-typed amenities
 * ("Large private pool") still resolve.
 */
const STANDOUT_PRIORITY = [
  "private pool",
  "beachfront",
  "beach access",
  "sea view",
  "ocean view",
  "infinity pool",
  "hot tub",
  "jacuzzi",
  "pool",
  "garden",
  "terrace",
  "mountain view",
] as const;

/** Picks the strongest amenity this property genuinely has, or null. */
function standoutAmenity(villa: Villa): string | null {
  const all = [...villa.amenities, ...(villa.facilities ?? [])];
  for (const needle of STANDOUT_PRIORITY) {
    const hit = all.find((a) => a.toLowerCase().includes(needle));
    if (hit) return hit;
  }
  return null;
}

/** Resolves an amenity name to its glyph element. Module-level (and lowercase)
 *  so no component type is created during render. */
function amenityGlyph(name: string): React.ReactNode {
  const Icon = getAmenityIcon(name);
  return <Icon className="h-5 w-5" strokeWidth={1.5} />;
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand/70 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

/**
 * The facts strip: guests, bedrooms, bathrooms, property type, location and a
 * standout amenity. Facts with no underlying data are simply omitted — the
 * strip never pads itself out with placeholders.
 */
export function PropertyQuickFacts({
  villa,
  stateName,
  /** Hotels/hostels count rooms/dorm types, not bedrooms. */
  roomsLabel,
}: {
  villa: Villa;
  stateName?: string;
  roomsLabel?: string;
}) {
  const type = villa.type ?? "villa";
  const place = [villa.city, stateName].filter(Boolean).join(", ");
  const standout = standoutAmenity(villa);

  const facts: React.ReactNode[] = [];

  if (villa.maxGuests > 0) {
    facts.push(
      <Fact
        key="guests"
        icon={<Users className="h-5 w-5" strokeWidth={1.5} />}
        label="Sleeps"
        value={`Up to ${villa.maxGuests} guests`}
      />,
    );
  }

  if (villa.bedrooms > 0) {
    facts.push(
      <Fact
        key="bedrooms"
        icon={<BedDouble className="h-5 w-5" strokeWidth={1.5} />}
        label={roomsLabel ?? "Bedrooms"}
        value={`${villa.bedrooms}`}
      />,
    );
  }

  if (villa.bathrooms > 0) {
    facts.push(
      <Fact
        key="bathrooms"
        icon={<Bath className="h-5 w-5" strokeWidth={1.5} />}
        label="Bathrooms"
        value={`${villa.bathrooms}`}
      />,
    );
  }

  facts.push(
    <Fact
      key="type"
      icon={<FileText className="h-5 w-5" strokeWidth={1.5} />}
      label="Property"
      value={TYPE_LABEL[type]}
    />,
  );

  if (place) {
    facts.push(
      <Fact
        key="place"
        icon={<MapPin className="h-5 w-5" strokeWidth={1.5} />}
        label="Location"
        value={place}
      />,
    );
  }

  if (standout) {
    facts.push(
      <Fact
        key="standout"
        icon={amenityGlyph(standout)}
        label="Standout"
        value={standout}
      />,
    );
  }

  if (facts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
      {facts.map((fact, i) => (
        <div
          key={i}
          className="border-border/50 sm:border-b sm:[&:nth-last-child(-n+2)]:border-b-0 sm:odd:border-r lg:[&:nth-child(3n)]:border-r-0 lg:odd:border-r lg:even:border-r lg:[&:nth-last-child(-n+3)]:border-b-0"
        >
          {fact}
        </div>
      ))}
    </div>
  );
}
