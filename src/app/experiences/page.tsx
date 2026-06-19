import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CallbackModal } from "@/components/callback-modal";
import { ExperiencesGrid } from "@/components/experiences-grid";
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
          More Than Just A Stay
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">
          Curated Experiences
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Elevate your stay with handpicked experiences designed to make your
          getaway unforgettable. Tap any experience to send a quick inquiry —
          our concierge tailors the rest.
        </p>
      </header>

      <ExperiencesGrid experiences={experiences} variant="list" />

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
