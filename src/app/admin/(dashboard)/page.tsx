import Link from "next/link";
import { Building2, Image as ImageIcon, Inbox, Plus } from "lucide-react";
import { getVillas } from "@/lib/data/villas";
import { getBanners } from "@/lib/data/banners";
import { readJson } from "@/lib/storage";
import type { StoredInquiry } from "@/app/api/inquiries/route";

export default async function AdminOverviewPage() {
  const villas = getVillas();
  const banners = getBanners();
  const inquiries = await readJson<StoredInquiry[]>("inquiries.json", []);

  const cards = [
    {
      href: "/admin/villas",
      icon: Building2,
      label: "Villas",
      value: villas.length,
      sub: `${villas.filter((v) => v.featured).length} featured`,
      cta: "Add a property",
      ctaHref: "/admin/villas/new",
    },
    {
      href: "/admin/banners",
      icon: ImageIcon,
      label: "Banners",
      value: banners.length,
      sub: "Hero slides on the homepage",
      cta: "Edit banners",
      ctaHref: "/admin/banners",
    },
    {
      href: "/admin/inquiries",
      icon: Inbox,
      label: "Inquiries",
      value: inquiries.length,
      sub: inquiries.length > 0
        ? `Latest: ${new Date(inquiries[0].createdAt).toLocaleDateString()}`
        : "No inquiries yet",
      cta: "View inbox",
      ctaHref: "/admin/inquiries",
    },
  ];

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Welcome back.</h1>
        <p className="mt-2 text-muted-foreground">
          Manage properties, swap homepage banners, and read incoming guest inquiries.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <c.icon className="h-5 w-5 text-terracotta" />
              <Link
                href={c.ctaHref}
                className="inline-flex items-center gap-1 text-xs text-terracotta hover:underline"
              >
                <Plus className="h-3 w-3" /> {c.cta}
              </Link>
            </div>
            <p className="mt-6 font-display text-5xl text-foreground">{c.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{c.sub}</p>
            <Link
              href={c.href}
              className="mt-4 inline-block text-sm text-foreground hover:underline"
            >
              Open {c.label.toLowerCase()} →
            </Link>
          </div>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-2xl">Quick reference</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>
            · Villa & banner edits write to <code className="rounded bg-muted px-1.5 py-0.5 text-xs">data/*.json</code> in your project — back this folder up.
          </li>
          <li>
            · Inquiries are stored in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">data/inquiries.json</code>. Hook up email notifications by setting <code className="rounded bg-muted px-1.5 py-0.5 text-xs">RESEND_API_KEY</code> in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code>.
          </li>
          <li>
            · For long-term content management, switch to the Sanity CMS schemas already stubbed in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">sanity/schemas.ts</code>.
          </li>
        </ul>
      </section>
    </div>
  );
}
