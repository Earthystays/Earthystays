import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ImageIcon,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import type { Opportunity } from "@/lib/host/opportunities";

const ICON: Record<Opportunity["kind"], LucideIcon> = {
  action: CheckCircle2,
  calendar: CalendarDays,
  demand: TrendingDown,
  content: ImageIcon,
};

const ACCENT: Record<Opportunity["kind"], string> = {
  action: "bg-terracotta/10 text-terracotta",
  calendar: "bg-primary/10 text-primary",
  demand: "bg-amber-100 text-amber-700",
  content: "bg-sand text-foreground/70",
};

export function OpportunitiesPanel({
  opportunities,
  limit,
}: {
  opportunities: Opportunity[];
  limit?: number;
}) {
  const shown = limit ? opportunities.slice(0, limit) : opportunities;

  return (
    <section aria-labelledby="opportunities-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="opportunities-heading"
          className="font-display text-xl font-bold tracking-tight text-foreground"
        >
          Opportunities
        </h2>
        {limit && opportunities.length > limit && (
          <Link
            href="/host/performance"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all {opportunities.length}
          </Link>
        )}
      </div>

      {shown.length === 0 ? (
        /* A genuinely clean slate — say so plainly rather than padding the
           panel with filler advice. */
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-5">
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-primary"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            Nothing needs your attention right now. Guests are answered, your
            listings are complete, and your calendar is up to date.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-3">
          {shown.map((o) => {
            const Icon = ICON[o.kind];
            return (
              <li
                key={o.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background p-5 sm:flex-row sm:items-center"
              >
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ACCENT[o.kind]}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-foreground">
                    {o.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {o.detail}
                  </p>
                </div>
                <Link
                  href={o.href}
                  className="shrink-0 self-start rounded-full border border-foreground/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background sm:self-auto"
                >
                  {o.cta}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
