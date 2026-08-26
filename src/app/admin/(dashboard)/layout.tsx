import { DM_Serif_Display } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  Home,
  Inbox,
  BellRing,
  MessageSquareQuote,
  Building2,
  MapPin,
  Layers,
  Compass,
  Sparkles,
  Image as ImageIcon,
  Users as UsersIcon,
  UserRound,
  Tags,
  ArrowUpRight,
  LogOut,
  Bell,
  ClipboardCheck,
  BookOpen,
  FileText,
  Mail,
  LayoutTemplate,
  BarChart3,
  ScrollText,
} from "lucide-react";
import { readJson } from "@/lib/storage";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllArticles } from "@/lib/data/journal";
import { getReviewsByStatus } from "@/lib/data/reviews";
import type { StoredInquiry } from "@/app/api/inquiries/route";
import type { Villa } from "@/lib/types";

/* Admin display face (owner's spec) — editorial accent for page/section/card
   headings. Declared here rather than in the root layout so public visitors
   never download a webfont only the admin panel uses. */
const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Earthy Stays", robots: { index: false, follow: false } };

type NavItem = { href: string; label: string; icon: typeof Home; badge?: number };
type NavGroup = { title: string; items: NavItem[] };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Every admin page renders through this layout, so this is the single
  // place that enforces the *full* check (including revocation) for pages.
  // The proxy has already done the cheap stateless half.
  await requireAdmin();

  const inquiries = await readJson<StoredInquiry[]>("inquiries.json", []);
  const newInquiries = inquiries.filter((q) => (q.status ?? "new") === "new").length;
  const conciergeNew = inquiries.filter(
    (q) => q.kind === "experience" && (q.status ?? "new") === "new",
  ).length;
  const storedVillas = await readJson<Villa[]>("villas.json", []);
  const pendingApprovals = storedVillas.filter(
    (v) => v.status === "pending_review",
  ).length;
  const pendingReviews = getReviewsByStatus("pending").length;
  const draftArticles = getAllArticles().filter(
    (a) => a.status === "draft" || a.status === "in_review",
  ).length;

  const groups: NavGroup[] = [
    {
      title: "Operations",
      items: [
        { href: "/admin", label: "Overview", icon: Home },
        {
          href: "/admin/approvals",
          label: "Approvals",
          icon: ClipboardCheck,
          badge: pendingApprovals,
        },
        { href: "/admin/inquiries", label: "Inquiries", icon: Inbox, badge: newInquiries },
        {
          href: "/admin/inquiries?kind=experience",
          label: "Concierge",
          icon: BellRing,
          badge: conciergeNew,
        },
        {
          href: "/admin/reviews",
          label: "Reviews",
          icon: MessageSquareQuote,
          badge: pendingReviews,
        },
      ],
    },
    {
      title: "Inventory",
      items: [
        { href: "/admin/villas", label: "Villas", icon: Building2 },
        { href: "/admin/locations", label: "Locations", icon: MapPin },
        { href: "/admin/collections", label: "Collections", icon: Layers },
        { href: "/admin/experiences", label: "Experiences", icon: Compass },
        { href: "/admin/experience-hosts", label: "Exp. hosts", icon: UserRound },
        { href: "/admin/experience-categories", label: "Exp. categories", icon: Tags },
        { href: "/admin/amenities", label: "Amenities", icon: Sparkles },
      ],
    },
    {
      title: "Content",
      items: [{ href: "/admin/banners", label: "Banners", icon: ImageIcon }],
    },
    {
      title: "Journal",
      items: [
        { href: "/admin/journal", label: "Dashboard", icon: BookOpen },
        {
          href: "/admin/journal/articles",
          label: "Articles",
          icon: FileText,
          badge: draftArticles,
        },
        { href: "/admin/journal/categories", label: "Categories", icon: Tags },
        { href: "/admin/journal/destinations", label: "Destinations", icon: MapPin },
        { href: "/admin/journal/authors", label: "Authors", icon: UserRound },
        { href: "/admin/journal/media", label: "Media", icon: ImageIcon },
        { href: "/admin/journal/campaigns", label: "Campaigns", icon: Sparkles },
        { href: "/admin/journal/homepage", label: "Homepage", icon: LayoutTemplate },
        { href: "/admin/journal/newsletter", label: "Newsletter", icon: Mail },
        { href: "/admin/journal/analytics", label: "Analytics", icon: BarChart3 },
      ],
    },
    {
      title: "CRM",
      items: [{ href: "/admin/users", label: "Guests", icon: UsersIcon }],
    },
    {
      title: "System",
      items: [{ href: "/admin/audit", label: "Audit log", icon: ScrollText }],
    },
  ];

  return (
    <div className={`${dmSerif.variable} admin-shell min-h-screen bg-[hsl(38_38%_96%)]`}>
      <div className="flex min-h-screen">
        {/* SIDEBAR — sand-beige, grouped nav, sage active state */}
        <aside className="hidden w-64 shrink-0 border-r border-[hsl(38_18%_88%)] bg-[hsl(38_30%_93%)] md:block">
          <div className="flex h-full flex-col p-6">
            {/* Brand mark — official Earthy Stays logo used site-wide */}
            <Link
              href="/admin"
              aria-label="Earthy Stays admin — home"
              className="flex items-center"
            >
              <Image
                src="/brand/logo.png"
                alt="Earthy Stays"
                width={1200}
                height={937}
                priority
                className="h-24 w-auto lg:h-28"
              />
            </Link>

            <nav className="mt-10 flex-1 space-y-7 overflow-y-auto">
              {groups.map((group) => (
                <div key={group.title}>
                  <p className="admin-nav-group mb-2.5 px-3">{group.title}</p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="admin-nav-item group flex items-center gap-3 rounded-lg px-3 py-2 text-[#4A4235] transition-colors hover:bg-white/60"
                        >
                          <item.icon
                            className="h-[18px] w-[18px] text-[#8A8072] group-hover:text-[#4A4235]"
                            strokeWidth={1.7}
                          />
                          <span className="flex-1">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="admin-numeric inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#5D7050] px-1.5 text-[10px] font-semibold text-white">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="mt-4 space-y-1 border-t border-[hsl(38_18%_88%)] pt-4">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-[#8A8072] hover:bg-white/60 hover:text-[#4A4235]"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Open public site
              </Link>
              <form action="/api/admin/logout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-[#8A8072] hover:bg-white/60 hover:text-[#4A4235]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-end gap-4 border-b border-[hsl(38_18%_88%)] bg-[hsl(38_38%_96%)] px-6 py-4 lg:px-10">
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(38_18%_88%)] bg-white text-[#4A4235] transition-colors hover:bg-[hsl(38_30%_93%)]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.7} />
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D9855A] px-1.5 text-[10px] font-semibold text-white">
          3
        </span>
      </button>
      <div className="flex items-center gap-3 rounded-full border border-[hsl(38_18%_88%)] bg-white py-1.5 pl-1.5 pr-4">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#E4EAD9] text-sm font-semibold text-[#5D7050]">
          AU
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-[#2A2A2A]">Admin User</span>
          <span className="text-[11px] text-[#8A8072]">Super Admin</span>
        </div>
      </div>
    </header>
  );
}

