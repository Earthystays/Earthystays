import Link from "next/link";
import { getAllDestinations } from "@/lib/data/locations";
import { getLocationCovers } from "@/lib/data/location-covers";
import { CoverUploader } from "./cover-uploader";
import { LocationCrud } from "./location-crud";

export const metadata = { title: "Locations · Admin" };

export default function AdminLocationsPage() {
  const covers = getLocationCovers();
  const destinations = getAllDestinations();

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Locations</h1>
        <p className="mt-2 text-muted-foreground">
          Change the cover photo of each state and city, or add brand-new
          locations to your collection.
        </p>
      </header>

      {/* Add / delete locations */}
      <LocationCrud destinations={destinations} />

      {/* Cover photos */}
      <section className="mt-10 border-t border-border/60 pt-10">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Cover photos
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Uploads override the bundled defaults — reset to roll back.
        </p>

        <div className="mt-6 space-y-10">
          {destinations.map((state) => (
            <section key={state.slug}>
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
                  {state.name}
                </h3>
                <Link
                  href={`/locations/${state.slug}`}
                  target="_blank"
                  className="text-xs text-terracotta hover:underline"
                >
                  View public page →
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <CoverUploader
                  storageKey={state.slug}
                  label={`${state.name} (state cover)`}
                  hint="Shown on /locations and at the top of the state page."
                  initialUrl={covers[state.slug]}
                  fallbackUrl={state.image.src}
                />
                {state.cities.map((city) => (
                  <CoverUploader
                    key={city.slug}
                    storageKey={`${state.slug}/${city.slug}`}
                    label={city.name}
                    hint={`Shown on the ${state.name} state page and the ${city.name} city page.`}
                    initialUrl={covers[`${state.slug}/${city.slug}`]}
                    fallbackUrl={city.image.src}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
