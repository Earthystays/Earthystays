import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  align = "left",
}: Props) {
  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${
        align === "center" ? "text-center md:flex-col md:items-center" : ""
      }`}
    >
      <div className={align === "center" ? "max-w-2xl mx-auto" : "max-w-2xl"}>
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.18em] text-terracotta">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 font-display text-3xl sm:text-4xl text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-terracotta hover:gap-2 transition-all"
        >
          {ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
