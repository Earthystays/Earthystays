import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Earthy Stays — a Goa-born hospitality brand for thoughtfully curated, community-driven stays.",
};

export default function AboutPage() {
  return (
    <div className="container-page py-16 lg:py-24">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-terracotta">
          Who we are
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl leading-[1.05]">
          About Earthy Stays
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-foreground/80">
          At Earthy Stays, we believe travel is about more than just finding a
          place to sleep — it&apos;s about experiencing destinations in a
          meaningful and authentic way.
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src="https://images.unsplash.com/photo-1502301103665-0b95cc738daf?auto=format&fit=crop&w=1600&q=80"
            alt="Sunlit veranda by the coast"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="space-y-5 text-muted-foreground leading-relaxed">
          <p>
            Founded in Goa, Earthy Stays is a hospitality brand dedicated to
            offering comfortable, thoughtfully curated accommodations that
            connect travelers with the local culture, nature, and community.
            From cozy apartments and charming villas to unique stays and future
            hospitality experiences, our goal is to create spaces that feel
            welcoming, memorable, and genuinely earthy.
          </p>
          <p>
            Over the years, we have built a growing portfolio of properties
            across Goa, serving families, couples, digital nomads, groups, and
            adventure seekers looking for quality stays at great value. Every
            property is carefully selected and professionally managed to ensure
            a seamless experience from booking to checkout.
          </p>
          <p>
            Our vision goes beyond accommodation. We aim to build a
            community-driven hospitality brand that celebrates sustainable
            travel, local experiences, meaningful connections, and a deeper
            appreciation for the places we call home.
          </p>
          <p>
            Whether you&apos;re visiting Goa for a relaxing holiday, a
            workcation, a family getaway, or a long-term stay, Earthy Stays is
            here to make your journey comfortable, authentic, and unforgettable.
          </p>
        </div>
      </div>

      <div className="mt-20 flex justify-center">
        <p className="text-center font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Stay Local.{" "}
          <span className="text-terracotta">Stay Comfortable.</span>{" "}
          Stay Earthy.
        </p>
      </div>
    </div>
  );
}
