import Link from "next/link";
import type { ReactNode } from "react";
import { Home, Building2, Image as ImageIcon, Inbox, MapPin, Sparkles, MessageSquareQuote, Layers, ArrowUpRight, LogOut } from "lucide-react";
import { readJson } from "@/lib/storage";
import type { StoredInquiry } from "@/app/api/inquiries/route";

const NAV = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/villas", label: "Villas", icon: Building2 },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/amenities", label: "Amenities", icon: Sparkles },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
];

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Earthy Stays", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const inquiries = await readJson<StoredInquiry[]>("inquiries.json", []);
  const newInquiriesCount = inquiries.filter(
    (q) => (q.status ?? "new") === "new",
  ).length;
  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="mx-auto flex max-w-7xl gap-8 px-5 py-8 lg:px-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-8">
            <Link href="/admin" className="font-display text-2xl text-foreground">
              Admin
            </Link>
            <nav className="mt-8 flex flex-col gap-1">
              {NAV.map((item) => {
                const showBadge =
                  item.href === "/admin/inquiries" && newInquiriesCount > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
                        {newInquiriesCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 border-t border-border/60 pt-4 space-y-1">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Open public site
              </Link>
              <form action="/api/admin/logout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
