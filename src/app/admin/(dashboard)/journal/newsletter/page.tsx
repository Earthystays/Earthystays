import { readSubscribers } from "@/lib/data/journal-newsletter";
import { SubscribersTable } from "./table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Newsletter · Journal" };

export default async function JournalNewsletterPage() {
  const subscribers = (await readSubscribers()).sort((a, b) =>
    b.subscribedAt.localeCompare(a.subscribedAt),
  );
  const active = subscribers.filter((s) => s.status === "subscribed").length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl">Newsletter</h1>
        <p className="mt-2 text-muted-foreground">
          {active} active subscriber{active === 1 ? "" : "s"} · {subscribers.length} total.
          Emails are private and never exposed on the public site.
        </p>
      </header>
      <SubscribersTable subscribers={subscribers} />
    </div>
  );
}
