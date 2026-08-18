"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import type { CityIndexState } from "@/lib/data/villas";

export function SiteChrome({
  children,
  user,
  villaStates,
  apartmentStates,
  showHotels = false,
  showHostels = false,
}: {
  children: ReactNode;
  user: { name: string; email: string; isHost?: boolean } | null;
  villaStates: CityIndexState[];
  apartmentStates: CityIndexState[];
  showHotels?: boolean;
  showHostels?: boolean;
}) {
  const path = usePathname();
  // Admin and host dashboards bring their own chrome — no public
  // header/footer/WhatsApp float there.
  // NB: use "/host/" (with trailing slash) + exact "/host" so this doesn't
  // also match the public "/hostels" section, which needs the normal chrome.
  const isDashboard =
    path === "/admin" ||
    path?.startsWith("/admin/") ||
    path === "/host" ||
    path?.startsWith("/host/");

  if (isDashboard) {
    return <div className="flex-1">{children}</div>;
  }

  // On the home page, the header overlays the hero (transparent at top,
  // solid once you've scrolled past the hero). Other pages get a normal opaque header.
  const isHome = path === "/";

  return (
    <>
      <SiteHeader
        user={user}
        transparent={isHome}
        villaStates={villaStates}
        apartmentStates={apartmentStates}
        showHotels={showHotels}
        showHostels={showHostels}
      />
      <main className={`flex-1 ${isHome ? "-mt-20" : ""}`}>{children}</main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
