import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import type { ReactNode } from "react";

const HERO_IMAGE = {
  src: "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&w=1600&q=80",
  alt: "Sunset villa pool",
};

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary/30 px-4 py-10 sm:py-14">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl md:grid-cols-2">
        {/* Image panel */}
        <div className="relative hidden min-h-[520px] md:block">
          <Image
            src={HERO_IMAGE.src}
            alt={HERO_IMAGE.alt}
            fill
            sizes="(min-width: 1024px) 500px, 50vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-white/80">
              Earthy Stays
            </p>
            <p className="mt-2 max-w-xs font-display text-2xl leading-snug">
              Personally vetted homes for slow weekends.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="relative flex flex-col px-6 py-8 sm:px-10 sm:py-12">
          <Link
            href="/"
            aria-label="Close"
            className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Link>
          <div className="max-w-sm">
            <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
