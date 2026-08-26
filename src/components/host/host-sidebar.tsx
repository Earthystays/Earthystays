"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  MessageSquare,
  CalendarDays,
  Home,
  BookOpenCheck,
  BarChart3,
  Wallet,
  Star,
  Settings,
  Headset,
  ArrowLeftRight,
} from "lucide-react";

const NAV: Array<{
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
}> = [
  // Owner-OS ordering. Labels follow the owner's language ("Properties",
  // "Reservations"); the underlying routes are unchanged so every existing
  // link, bookmark and in-app href keeps working.
  { href: "/host", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/host/listings", label: "Properties", icon: Home },
  { href: "/host/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/host/bookings", label: "Reservations", icon: BookOpenCheck },
  { href: "/host/performance", label: "Performance", icon: BarChart3 },
  { href: "/host/payouts", label: "Payouts", icon: Wallet },
  { href: "/host/reviews", label: "Reviews", icon: Star },
  { href: "/host/inbox", label: "Messages", icon: MessageSquare },
  { href: "/host/settings", label: "Settings", icon: Settings },
] as const;

export function HostSidebar({
  userName,
  unread,
}: {
  userName: string;
  unread: number;
}) {
  const pathname = usePathname();
  const initial = userName.charAt(0).toUpperCase() || "H";

  const items = NAV.map((item) => {
    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    return { ...item, active };
  });

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-border/60 bg-background px-4 py-6 lg:flex">
        <Link href="/host" className="flex items-center gap-2 px-2" aria-label="Hosting home">
          <Image src="/brand/logo.png" alt="Earthy Stays" width={120} height={94} className="h-10 w-auto" />
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14.5px] transition-colors ${
                active
                  ? "bg-primary/10 font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
              <span className="flex-1">{label}</span>
              {label === "Inbox" && unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {unread}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="mt-4 flex items-center gap-3 rounded-xl border border-border/70 px-3.5 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-muted/60"
        >
          <ArrowLeftRight className="h-[17px] w-[17px]" strokeWidth={1.9} />
          Switch to travelling
        </Link>

        <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <p className="text-sm font-semibold">Need help?</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Our team is here when you need us.
          </p>
          <Link
            href="https://wa.me/919657100004?text=Hi%20Earthy%20Stays%20concierge%20%E2%80%94%20host%20support"
            target="_blank"
            className="mt-3 flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50"
          >
            <Headset className="h-4 w-4" />
            Contact us
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">Host</p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link href="/host" aria-label="Hosting home">
            <Image src="/brand/logo.png" alt="Earthy Stays" width={100} height={78} className="h-8 w-auto" />
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {items.map(({ href, label, active }) => (
              <Link
                key={href}
                href={href}
                className={`relative whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] ${
                  active ? "bg-primary/10 font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
                {label === "Inbox" && unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
                )}
              </Link>
            ))}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border/70 px-3 py-1.5 text-[13px] font-medium"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Travel mode
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
