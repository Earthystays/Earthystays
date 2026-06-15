"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { writeJson } from "@/lib/storage";
import { getSeedBanners } from "@/lib/data/banners";
import type { HeroSlide } from "@/components/hero-slider";

const SlideSchema = z.object({
  // Accept either a full http(s) URL or a local path (e.g. /uploads/foo.jpg)
  imageSrc: z
    .string()
    .min(1, "Image required")
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
      "Use an uploaded image or a full http(s) URL",
    ),
  imageAlt: z.string().min(1),
  videoSrc: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v),
      "Video must be uploaded or a full http(s) URL",
    ),
  eyebrow: z.string().optional(),
  title: z.string().min(2),
  subtitle: z.string().optional(),
  chip: z.string().optional(),
  href: z.string().min(1),
});

export type SaveBannersState = {
  ok: boolean;
  error?: string;
  message?: string;
};

// Default state lives in the editor component; "use server" files
// can only export async functions, never plain objects or values.

export async function saveBanners(
  _prev: SaveBannersState,
  form: FormData,
): Promise<SaveBannersState> {
  const count = Number(form.get("count") ?? 0);
  if (!count || count < 1) return { ok: false, error: "At least one slide required" };
  if (count > 10) return { ok: false, error: "Maximum 10 slides" };

  const slides: HeroSlide[] = [];
  for (let i = 0; i < count; i++) {
    const raw = {
      imageSrc: String(form.get(`slides.${i}.imageSrc`) ?? "").trim(),
      imageAlt: String(form.get(`slides.${i}.imageAlt`) ?? "").trim(),
      videoSrc: String(form.get(`slides.${i}.videoSrc`) ?? "").trim() || undefined,
      eyebrow: String(form.get(`slides.${i}.eyebrow`) ?? "").trim() || undefined,
      title: String(form.get(`slides.${i}.title`) ?? "").trim(),
      subtitle: String(form.get(`slides.${i}.subtitle`) ?? "").trim() || undefined,
      chip: String(form.get(`slides.${i}.chip`) ?? "").trim() || undefined,
      href: String(form.get(`slides.${i}.href`) ?? "/villas").trim(),
    };
    const parsed = SlideSchema.safeParse(raw);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return { ok: false, error: `Slide ${i + 1}: ${firstIssue.path.join(".")} — ${firstIssue.message}` };
    }
    slides.push({
      image: { src: parsed.data.imageSrc, alt: parsed.data.imageAlt },
      videoSrc: parsed.data.videoSrc || undefined,
      eyebrow: parsed.data.eyebrow,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle,
      chip: parsed.data.chip,
      href: parsed.data.href,
    });
  }

  await writeJson("banners.json", slides);
  revalidatePath("/");
  return { ok: true, message: `Saved ${slides.length} slides.` };
}

export async function resetBanners(): Promise<SaveBannersState> {
  await writeJson("banners.json", getSeedBanners());
  revalidatePath("/");
  return { ok: true, message: "Reverted to seed banners." };
}
