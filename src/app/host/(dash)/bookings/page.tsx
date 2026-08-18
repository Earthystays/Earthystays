import { requireHost } from "@/lib/host-auth";
import { getVillasByHost } from "@/lib/data/villas";
import { readJson } from "@/lib/storage";
import type { StoredInquiry } from "@/app/api/inquiries/route";
import { RequestCard } from "@/components/host/request-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Booking requests · Hosting" };

export default async function HostBookingsPage() {
  const user = await requireHost();
  const listings = getVillasByHost(user.id);
  const bySlug = new Map(listings.map((l) => [l.slug, l.name]));

  const inquiries = await readJson<StoredInquiry[]>("inquiries.json", []);
  const requests = inquiries
    .filter((q) => q.villa && bySlug.has(q.villa))
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const pending = requests.filter((q) => !q.hostDecision);
  const answered = requests.filter((q) => q.hostDecision);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Booking requests</h1>
      <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
        Accepting holds the dates for the guest — the Earthy Stays concierge then confirms
        every booking personally. The team sees each request alongside you, so nothing slips.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Pending {pending.length > 0 && <span className="text-primary">· {pending.length}</span>}
        </h2>
        {pending.length === 0 ? (
          <p className="mt-4 rounded-xl border border-border/70 bg-muted/30 px-5 py-6 text-sm text-muted-foreground">
            Nothing waiting on you right now.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border/70 rounded-xl border border-border/70">
            {pending.map((q) => (
              <RequestCard key={q.id} inquiry={q} listingName={bySlug.get(q.villa!)} />
            ))}
          </div>
        )}
      </section>

      {answered.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Answered</h2>
          <div className="mt-4 divide-y divide-border/70 rounded-xl border border-border/70">
            {answered.map((q) => (
              <RequestCard key={q.id} inquiry={q} listingName={bySlug.get(q.villa!)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
