import Image from "next/image";
import {
  Baby,
  Car,
  Check,
  ChevronDown,
  Clock,
  Globe,
  Languages,
  MapPin,
  Mountain,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { CarryItem, Experience, ExperienceHost, ItineraryStop } from "@/lib/types";
import { ExpIcon } from "./exp-icon";

/* --- Shared wrappers --- */

export function Section({
  id,
  title,
  sub,
  children,
}: {
  id?: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-44">
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ExperienceFaq({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

/* --- Section 2: quick info cards --- */

export function QuickInfoCards({ e }: { e: Experience }) {
  const items: { icon: React.ReactNode; label: string; value: string }[] = [];
  const add = (icon: React.ReactNode, label: string, value?: string | boolean) => {
    if (value === undefined || value === "" || value === false) return;
    items.push({ icon, label, value: value === true ? "Available" : String(value) });
  };
  const I = "h-5 w-5 text-terracotta";
  add(<MapPin className={I} />, "Meeting point", e.meetingPoint);
  add(<Clock className={I} />, "Duration", e.duration);
  add(
    <Users className={I} />,
    "Group size",
    e.groupMin && e.groupMax ? `${e.groupMin}–${e.groupMax} people` : undefined,
  );
  add(<Languages className={I} />, "Languages", e.languages?.join(", "));
  add(<UtensilsCrossed className={I} />, "Meals", e.mealsIncluded);
  add(<Car className={I} />, "Pickup", e.pickupNote ?? e.pickupAvailable);
  add(<Baby className={I} />, "Age limit", e.ageLimit);
  add(<UserCheck className={I} />, "Private", e.privateAvailable);
  add(<Mountain className={I} />, "Difficulty", e.difficulty);
  add(<Globe className={I} />, "Accessibility", e.accessibility);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <div key={it.label} className="bg-card p-4">
          {it.icon}
          <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
            {it.label}
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{it.value}</p>
        </div>
      ))}
    </div>
  );
}

/* --- Section 3: highlights --- */

export function ExperienceHighlights({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((h) => (
        <li key={h} className="flex items-start gap-2.5 text-sm">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10">
            <Check className="h-3 w-3 text-primary" />
          </span>
          <span>{h}</span>
        </li>
      ))}
    </ul>
  );
}

/* --- Section 4: your journey timeline --- */

export function ExperienceTimeline({ stops }: { stops: ItineraryStop[] }) {
  return (
    <ol className="relative space-y-6 border-l border-border/70 pl-6">
      {stops.map((s) => (
        <li key={s.id} className="relative">
          <span className="absolute -left-[27px] top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-primary bg-background" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              {s.time && (
                <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">
                  {s.time}
                  {s.duration && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      · {s.duration}
                    </span>
                  )}
                </p>
              )}
              <h3 className="mt-1 font-medium text-foreground">{s.title}</h3>
              {s.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>
              )}
            </div>
            {s.photo && (
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={s.photo.src}
                  alt={s.photo.alt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* --- Section 5: about your host --- */

export function AboutHost({ host }: { host: ExperienceHost }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex items-center gap-4">
        {host.photo && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
            <Image src={host.photo.src} alt={host.photo.alt} fill sizes="64px" className="object-cover" />
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Hosted by</p>
          <p className="inline-flex items-center gap-1.5 font-display text-2xl">
            {host.name}
            {host.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
          </p>
          {typeof host.rating === "number" && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-terracotta text-terracotta" />
              {host.rating.toFixed(1)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        {typeof host.guestsHosted === "number" && (
          <span>Hosted {host.guestsHosted}+ guests</span>
        )}
        {typeof host.yearsExperience === "number" && (
          <span>{host.yearsExperience} years experience</span>
        )}
        {host.languages && host.languages.length > 0 && (
          <span>Speaks {host.languages.join(", ")}</span>
        )}
      </div>

      {host.bio && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{host.bio}</p>
      )}
    </div>
  );
}

/* --- Sections 6 & 7: included / excluded --- */

export function IncludedExcluded({
  included,
  excluded,
}: {
  included?: string[];
  excluded?: string[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {included && included.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h3 className="font-display text-xl">What&apos;s Included</h3>
          <ul className="mt-3 space-y-2">
            {included.map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {excluded && excluded.length > 0 && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
          <h3 className="font-display text-xl">What&apos;s Not Included</h3>
          <ul className="mt-3 space-y-2">
            {excluded.map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* --- Section 8: things to carry --- */

export function ThingsToCarry({ items }: { items: CarryItem[] }) {
  // Some entries get pasted as one long comma-separated sentence instead of
  // separate items — split those into individual rows so the list always
  // reads as a clean checklist rather than a wall of text in a single pill.
  const rows = items.flatMap((it) =>
    it.label
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label) => ({ label, icon: it.icon })),
  );

  return (
    <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {rows.map((it, i) => (
        <li key={`${it.label}-${i}`} className="flex items-start gap-3 text-sm text-foreground">
          <ExpIcon name={it.icon} className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
          <span className="leading-relaxed">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}

export { Sparkles };
