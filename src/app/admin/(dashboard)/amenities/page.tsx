import { getStoredAmenities } from "@/lib/data/amenities-store";
import {
  VILLA_AMENITIES,
  VILLA_FACILITIES,
} from "../villas/new/constants";
import { AmenitiesEditor } from "./editor";

export const metadata = { title: "Amenities · Admin" };

export default function AdminAmenitiesPage() {
  const stored = getStoredAmenities();

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Amenities & Facilities</h1>
        <p className="mt-2 text-muted-foreground">
          Add custom amenities (in-villa) and facilities (property-wide) with an icon.
          Custom entries appear in the villa form alongside the bundled defaults, and
          their icons render on every villa detail page.
        </p>
      </header>

      <AmenitiesEditor
        initial={stored}
        seedAmenities={[...VILLA_AMENITIES]}
        seedFacilities={[...VILLA_FACILITIES]}
      />
    </div>
  );
}
