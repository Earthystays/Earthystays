"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type HeroSlide = {
  image: { src: string; alt: string };
  eyebrow?: string;
  title: string;
  subtitle?: string;
  chip?: string;
  href: string;
};

const ROTATE_MS = 6500;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const playing = useRef(true);
  const last = useRef(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      if (!playing.current) return;
      if (Date.now() - last.current < ROTATE_MS - 100) return;
      last.current = Date.now();
      setI((p) => (p + 1) % slides.length);
    }, 500);
    return () => clearInterval(id);
  }, [slides.length]);

  function goto(idx: number) {
    last.current = Date.now();
    setI((idx + slides.length) % slides.length);
  }

  return (
    <section
      className="relative h-[88vh] min-h-[620px]"
      onMouseEnter={() => {
        playing.current = false;
      }}
      onMouseLeave={() => {
        playing.current = true;
      }}
    >
      {slides.map((s, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === i ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={idx !== i}
        >
          <Image
            src={s.image.src}
            alt={s.image.alt}
            fill
            priority={idx === 0}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/65" />
          <div className="container-page absolute inset-0 flex flex-col items-center justify-center text-center text-white">
            {s.eyebrow && (
              <p className="text-xs uppercase tracking-[0.22em] text-white/80">
                {s.eyebrow}
              </p>
            )}
            <h1 className="mt-3 max-w-3xl font-display text-3xl leading-[1.1] sm:text-4xl md:text-5xl lg:text-[56px]">
              {s.title}
            </h1>
            {s.subtitle && (
              <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
                {s.subtitle}
              </p>
            )}
            {s.chip && (
              <Link
                href={s.href}
                className="mt-8 inline-flex items-center rounded-full border border-white/60 bg-white/0 px-6 py-2.5 text-sm transition-colors hover:bg-white hover:text-foreground"
              >
                {s.chip}
              </Link>
            )}
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={() => goto(i - 1)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/50 bg-black/20 p-3 text-white backdrop-blur transition-colors hover:bg-black/40 md:left-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goto(i + 1)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/50 bg-black/20 p-3 text-white backdrop-blur transition-colors hover:bg-black/40 md:right-8"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-32 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goto(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1 rounded-full transition-all ${
                  idx === i ? "w-10 bg-white" : "w-5 bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
