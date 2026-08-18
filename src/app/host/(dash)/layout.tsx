import type { ReactNode } from "react";
import { requireHost } from "@/lib/host-auth";
import { getThreadsForHost, unreadCount } from "@/lib/data/messages";
import { HostSidebar } from "@/components/host/host-sidebar";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Hosting · Earthy Stays",
  robots: { index: false, follow: false },
};

export default async function HostLayout({ children }: { children: ReactNode }) {
  const user = await requireHost();
  const threads = await getThreadsForHost(user.id);
  const unread = threads.reduce((n, t) => n + unreadCount(t, "host"), 0);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground lg:flex">
      <HostSidebar userName={user.name || user.email} unread={unread} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
