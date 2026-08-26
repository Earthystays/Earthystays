"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/host", label: "Overview" },
  { href: "/host/listings", label: "Properties" },
  { href: "/host/calendar", label: "Calendar" },
  { href: "/host/bookings", label: "Reservations" },
  { href: "/host/inbox", label: "Messages" },
];

export function HostNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {TABS.map((t) => {
        const active =
          t.href === "/host" ? pathname === "/host" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              active
                ? "bg-muted font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
