import Image from "next/image";
import type { Metadata } from "next";
import { BadgeCheck, Sparkles, Wallet, ShieldCheck, Mail, Phone } from "lucide-react";
import { PartnerForm } from "@/components/partner-form";

export const metadata: Metadata = {
  title: "Partner with us",
  description:
    "List your villa or apartment on Earthy Stays. Higher RevPAR, curated guests, full property care.",
};

const HERO_IMAGE = {
  src: "https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=2400&q=80",
  alt: "Sunset over a cliff-side pool villa",
};

export default function PartnerPage() {
  return (
    <div>
      {/* HERO with form on the right */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <Image
            src={HERO_IMAGE.src}
            alt={HERO_IMAGE.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/40" />
        </div>

        <div className="container-page grid min-h-[70vh] items-center gap-10 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="text-white">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/85">
              For property owners
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Earn more from your villa.
              <br />
              Stress less about running it.
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
              Cross-list your property on Earthy Stays and let our team handle the
              photography, listing, guest screening, pricing, and on-ground operations —
              you keep the keys, we keep it full.
            </p>

            <ul className="mt-8 grid max-w-md gap-3 text-sm text-white/90 sm:grid-cols-2">
              <Bullet>Up to 40% higher revenue</Bullet>
              <Bullet>Vetted guests only</Bullet>
              <Bullet>Full property care</Bullet>
              <Bullet>Monthly payouts</Bullet>
            </ul>
          </div>

          <div className="w-full max-w-md justify-self-end">
            <PartnerForm />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border/60 bg-secondary/30">
        <div className="container-page grid grid-cols-2 gap-y-6 py-10 md:grid-cols-4 md:gap-x-8">
          <Stat value="60+" label="Villas in the collection" />
          <Stat value="40%" label="Avg revenue uplift" />
          <Stat value="24/7" label="Owner support" />
          <Stat value="4.9★" label="Guest satisfaction" />
        </div>
      </section>

      {/* Benefit cards */}
      <section className="container-page py-16 lg:py-20">
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
            Why partner with Earthy Stays
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Built for owners who care about their home.
          </h2>
        </header>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Benefit
            icon={<BadgeCheck className="h-5 w-5 text-terracotta" />}
            title="Vetted demand"
            desc="Our guests are quiet weekenders and milestone planners — not party crowds."
          />
          <Benefit
            icon={<Sparkles className="h-5 w-5 text-terracotta" />}
            title="Editorial showcase"
            desc="Professional photography, copy, and a curated detail page on the site."
          />
          <Benefit
            icon={<ShieldCheck className="h-5 w-5 text-terracotta" />}
            title="Care & screening"
            desc="Refundable deposits, ID verification, 24/7 guest support, on-ground staff."
          />
          <Benefit
            icon={<Wallet className="h-5 w-5 text-terracotta" />}
            title="Higher RevPAR"
            desc="Dynamic pricing and a curated audience consistently outperform OTAs."
          />
        </div>

        <div className="mt-12 rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Prefer to talk?
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-8">
            <a
              href="mailto:reservations@earthyrooms.com"
              className="inline-flex items-center gap-2 text-sm text-foreground hover:text-terracotta"
            >
              <Mail className="h-4 w-4 text-terracotta" />
              reservations@earthyrooms.com
            </a>
            <a
              href="tel:+919657100004"
              className="inline-flex items-center gap-2 text-sm text-foreground hover:text-terracotta"
            >
              <Phone className="h-4 w-4 text-terracotta" />
              +91 9657100004
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold">
        ✓
      </span>
      {children}
    </li>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-numeric text-3xl font-bold tracking-tight tabular-nums text-foreground sm:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Benefit({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      {icon}
      <p className="mt-4 font-display text-lg font-bold tracking-tight">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
