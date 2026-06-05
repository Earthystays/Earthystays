import Link from "next/link";
import { getBanners } from "@/lib/data/banners";
import { BannerEditor } from "./editor";

export default function AdminBannersPage() {
  const banners = getBanners();
  return (
    <div className="max-w-4xl">
      <header>
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to overview
        </Link>
        <h1 className="mt-3 font-display text-4xl">Homepage banners</h1>
        <p className="mt-2 text-muted-foreground">
          Add, remove, reorder, or swap the slides that rotate in the hero on the homepage.
          Changes go live immediately on save.
        </p>
      </header>

      <BannerEditor initial={banners} />
    </div>
  );
}
