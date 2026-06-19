import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CallbackModal } from "@/components/callback-modal";
import { getAllExperiences } from "@/lib/data/experiences";

export const metadata: Metadata = {
  title: "Curated Experiences",
  description:
    "Premium concierge offerings to elevate your Earthy Stays getaway — yacht charters, private chefs, celebrations, airport transfers and more.",
};

export default function ExperiencesPage() {
  const experiences = getAllExperiences();

  return (
    <div className="container-page py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Experiences" },
        ]}
      />

      <header className="mt-6 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
          For your stay
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">
          Curated Experiences
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Elevate your stay with handpicked experiences designed to make your
          getaway unforgettable. Tell us what you have in mind — our concierge
          will tailor the rest.
        </p>
      </header>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {experiences.map((e) => (
          <article
            key={e.slug}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted"
          >
            <Image
              src={e.image.src}
              alt={e.image.alt}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
              <h2 className="font-display text-2xl font-semibold leading-tight">
                {e.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-white/85">
                {e.blurb}
              </p>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-20 overflow-hidden rounded-3xl bg-foreground text-background">
        <div className="flex flex-col items-center gap-4 px-6 py-14 text-center sm:px-12 sm:py-20">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta/90">
            Concierge desk
          </p>
          <h2 className="font-display text-3xl sm:text-4xl">
            Need Something Special?
          </h2>
          <p className="max-w-xl text-sm text-background/75 sm:text-base">
            Tell us about your dates, group and what would make this trip
            unforgettable — our concierge will build a shortlist within the
            day.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/partner"
              className="inline-flex items-center justify-center rounded-full border border-background/40 px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background/10"
            >
              Partner with us
            </Link>
            <CallbackModal
              triggerLabel="Contact concierge"
              showIcon={false}
              triggerClassName="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
