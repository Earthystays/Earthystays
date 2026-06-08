import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/session";
import { getCityIndex } from "@/lib/data/villas";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Inter has excellent, even-width numerals at every weight — used for prices,
// stats, counters, ratings, anywhere a number is the primary content.
const inter = Inter({
  variable: "--font-inter",
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
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();
  const user = currentUser
    ? { name: currentUser.name, email: currentUser.email }
    : null;
  const villaStates = getCityIndex("villa");
  const apartmentStates = getCityIndex("apartment");

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteChrome
          user={user}
          villaStates={villaStates}
          apartmentStates={apartmentStates}
        >
          {children}
        </SiteChrome>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
