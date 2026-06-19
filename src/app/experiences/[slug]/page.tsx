import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  ChevronDown,
  MessageCircle,
  Check,
  Sparkles,
  Settings2,
  MapPin,
  Headphones,
  ChefHat,
  Wheat,
  UtensilsCrossed,
  Flower,
  Camera,
  PlaneLanding,
  Car,
  UserCheck,
  ShieldCheck,
  CalendarRange,
  Truck,
  ClipboardCheck,
  Building2,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  getAllExperiences,
  getExperienceBySlug,
} from "@/lib/data/experiences";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CallbackModal } from "@/components/callback-modal";
import { ExperienceInquiryForm } from "@/components/experience-inquiry-form";

const PHONE_E164 = "+919657100004";
const WHATSAPP_URL = (slug: string, name: string) =>
  `https://wa.me/${PHONE_E164.replace("+", "")}?text=${encodeURIComponent(
    `Hi! I'd like to know more about ${name} (${slug}).`,
  )}`;

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Settings2,
  MapPin,
  Headphones,
  ChefHat,
  Wheat,
  UtensilsCrossed,
  Flower,
  Camera,
  PlaneLanding,
  Car,
  UserCheck,
  ShieldCheck,
  CalendarRange,
  Truck,
  ClipboardCheck,
  Building2,
  Users,
};

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllExperiences().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const exp = getExperienceBySlug(slug);
  if (!exp) return { title: "Not found" };
  const title = exp.hero?.title ?? `${exp.name} · Earthy Stays`;
  return {
    title,
    description: exp.hero?.description ?? exp.blurb,
    openGraph: { title, description: exp.blurb, images: [exp.image.src] },
  };
}

export default async function ExperienceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const exp = getExperienceBySlug(slug);
  if (!exp) notFound();

  const heroTitle = exp.hero?.title ?? `Luxury ${exp.name} in Goa`;
  const heroDescription = exp.hero?.description ?? exp.blurb;
  const overview = exp.overview ?? exp.blurb;
  const perfectFor = exp.perfectFor ?? [];
  const whatsIncluded = exp.whatsIncluded ?? [];
  const gallery = exp.gallery ?? [];
  const faqs = exp.faqs ?? [];
  const related = getAllExperiences()
    .filter((e) => e.slug !== exp.slug)
    .slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="relative h-[80vh] min-h-[520px] w-full overflow-hidden">
        <Image
          src={exp.image.src}
          alt={exp.image.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/75" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-14 text-white sm:pb-20">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Experiences", href: "/experiences" },
              { label: exp.name },
            ]}
          />
          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-white/80">
            For your stay
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            {heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
            {heroDescription}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#inquiry"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Plan My Experience
            </a>
            <a
              href={WHATSAPP_URL(exp.slug, exp.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/0 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Concierge
            </a>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="container-page py-20">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
              Overview
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              The experience
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {overview}
            </p>
          </div>
          {whatsIncluded.length > 0 && (
            <aside className="rounded-2xl border border-border/60 bg-card p-6 sm:p-7">
              <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
                Concierge promise
              </p>
              <ul className="mt-4 space-y-3 text-sm text-foreground">
                {whatsIncluded.slice(0, 4).map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                    <span>{item.title}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#inquiry"
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-terracotta hover:underline"
              >
                Plan with our concierge <ArrowUpRight className="h-4 w-4" />
              </a>
            </aside>
          )}
        </div>
      </section>

      {/* PERFECT FOR */}
      {perfectFor.length > 0 && (
        <section className="bg-secondary/40 py-20">
          <div className="container-page">
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
              Perfect for
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              Designed around the moment
            </h2>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {perfectFor.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-5 py-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-terracotta" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="container-page py-20">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
            Glimpses
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            Experience gallery
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {gallery.map((img, i) => (
              <div
                key={img.src + i}
                className={`relative overflow-hidden rounded-2xl bg-muted ${
                  i % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"
                }`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* WHAT'S INCLUDED */}
      {whatsIncluded.length > 0 && (
        <section className="bg-secondary/40 py-20">
          <div className="container-page">
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
              What&apos;s included
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              The full concierge service
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {whatsIncluded.map((item) => {
                const Icon = (item.icon && ICONS[item.icon]) || Sparkles;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border/60 bg-card p-6"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* INQUIRY */}
      <section id="inquiry" className="container-page py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,480px)] lg:gap-16">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
              Get a quote
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              Plan {exp.name} for your stay
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Share the basics and our concierge sends back a tailored
              proposal — usually within a few hours. No pricing online; every
              quote is built around the date, group, and occasion.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-terracotta" /> No payment until
                everything is confirmed
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-terracotta" /> WhatsApp-first
                coordination
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-terracotta" /> Free to
                reschedule until 48 hours before
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
            <ExperienceInquiryForm
              experienceSlug={exp.slug}
              experienceName={exp.name}
            />
          </div>
        </div>
      </section>

      {/* FAQS */}
      {faqs.length > 0 && (
        <section className="bg-secondary/40 py-20">
          <div className="container-page max-w-3xl">
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
              FAQs
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              Good to know
            </h2>
            <div className="mt-8 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
              {faqs.map((q) => (
                <details key={q.question} className="group">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
                    <span>{q.question}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {q.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RELATED */}
      {related.length > 0 && (
        <section className="container-page py-20">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
            Round out the trip
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            You may also like
          </h2>
          <div className="mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/experiences/${r.slug}`}
                className="group relative aspect-[4/5] w-[68vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-muted sm:w-auto sm:shrink"
              >
                <Image
                  src={r.image.src}
                  alt={r.image.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 68vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm transition-transform group-hover:scale-110">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                  <h3 className="font-display text-xl font-semibold leading-tight sm:text-2xl">
                    {r.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-white/85 sm:text-sm">
                    {r.blurb}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CONCIERGE CTA */}
      <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=1800&q=80"
          alt="Sunset view of an Earthy Stays villa pool"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75" />
        <div className="container-page relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta/90">
            Concierge desk
          </p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">
            Need Something Special?
          </h2>
          <p className="mt-4 max-w-xl text-sm text-white/80 sm:text-base">
            Our concierge team can curate personalized experiences tailored to
            your stay.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#inquiry"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Plan My Experience
            </a>
            <CallbackModal
              triggerLabel="Contact Concierge"
              showIcon={false}
              triggerClassName="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 cursor-pointer"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
