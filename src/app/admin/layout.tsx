import type { ReactNode } from "react";

export const metadata = {
  title: "Admin · Earthy Stays",
  robots: { index: false, follow: false },
};

/**
 * Bare admin shell — the root layout is suppressed for /admin/* via
 * SiteChrome (no public header/footer/WhatsApp float). The (dashboard)
 * group adds the sidebar; /admin/login skips it.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
