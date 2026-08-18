import type { Metadata } from "next";
import { Cormorant_Garamond, Karla, Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { getCurrentUser } from "@/lib/session";
import { getCityIndex, getHotels, getHostels } from "@/lib/data/villas";

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Playfair Display carries headings. Numeric face is Manrope (see
// --font-numeric in globals.css) — prices, stats, counters, ratings.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// Listing-card design system faces (owner's spec): Cormorant Garamond
// for property names, Manrope for everything else in the card.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant-next",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope-next",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Earthy Stays — Handpicked villa rentals across India",
    template: "%s · Earthy Stays",
  },
  description:
    "Curated villa rentals across India's coastlines, hills, and heritage cities. Private pools, full staff, unforgettable stays.",
  metadataBase: new URL("https://earthystays.com"),
  verification: {
    // Google Search Console — keeps the site verified for the linked account.
    google: "Lp2wW7n4dcZoA1oLDucvYdM8DC8qbc5RmZyD5htOHX8",
  },
  // Explicit icon links so Google + every browser pick the right size.
  // Google specifically requires a multiple of 48px — these are 48, 96, 192, 512.
  icons: {
    icon: [
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();
  const user = currentUser
    ? { name: currentUser.name, email: currentUser.email, isHost: !!currentUser.isHost }
    : null;
  const villaStates = getCityIndex("villa");
  const apartmentStates = getCityIndex("apartment");
  // Hide the Hotels / Hostels nav sections until at least one such property
  // is actually live — no empty sections before the first goes public.
  const showHotels = getHotels().length > 0;
  const showHostels = getHostels().length > 0;

  return (
    <html
      lang="en"
      className={`${karla.variable} ${playfair.variable} ${cormorant.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteChrome
          user={user}
          villaStates={villaStates}
          apartmentStates={apartmentStates}
          showHotels={showHotels}
          showHostels={showHostels}
        >
          {children}
        </SiteChrome>
        <Toaster richColors position="top-center" />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
