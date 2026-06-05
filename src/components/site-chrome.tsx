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
}: {
  children: ReactNode;
  user: { name: string; email: string } | null;
  villaStates: CityIndexState[];
  apartmentStates: CityIndexState[];
}) {
  const path = usePathname();
  const isAdmin = path?.startsWith("/admin");

  if (isAdmin) {
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
      />
      <main className={`flex-1 ${isHome ? "-mt-20" : ""}`}>{children}</main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
