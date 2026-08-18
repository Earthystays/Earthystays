import Link from "next/link";
import { getVillasWithHidden } from "@/lib/data/villas";
import { getUsers } from "@/lib/data/users";
import { approveListing, rejectListing } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approvals · Admin" };

export default async function ApprovalsPage() {
  const all = getVillasWithHidden();
  const pending = all
    .filter((v) => v.status === "pending_review")
    .sort((a, b) => (a.submittedAt ?? "") < (b.submittedAt ?? "") ? -1 : 1);
  const users = await getUsers();
  const hostName = (id?: string) =>
    users.find((u) => u.id === id)?.name ?? "Unknown host";
  const hostPhone = (id?: string) => users.find((u) => u.id === id)?.hostPhone;

  return (
    <div className="max-w-4xl">
      <header>
        <h1 className="font-display text-4xl">Approvals</h1>
        <p className="mt-2 text-muted-foreground">
          Host-submitted listings wait here — nothing goes live without your sign-off.
          Approving publishes immediately; rejecting sends the host your note.
        </p>
      </header>

      {pending.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border/60 bg-card px-6 py-14 text-center text-muted-foreground">
          Queue is clear — no listings waiting for review.
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {pending.map((v) => (
            <div key={v.slug} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex flex-wrap items-start gap-4">
                {v.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.images[0].src} alt="" className="h-20 w-28 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                    no photo
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold">{v.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[v.city, v.state].filter(Boolean).join(", ") || v.locationNote} ·{" "}
                    <span className="capitalize">{v.type ?? "villa"}</span> · {v.bedrooms} bd ·{" "}
                    {v.maxGuests} guests · ₹{v.pricePerNight.toLocaleString("en-IN")}/night
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Host: <span className="font-medium text-foreground">{hostName(v.hostId)}</span>
                    {hostPhone(v.hostId) && ` · ${hostPhone(v.hostId)}`}
                    {v.submittedAt &&
                      ` · submitted ${new Date(v.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                    {" · "}{v.images.length} photos · {v.amenities.length} amenities
                  </p>
                  <p className="mt-2 line-clamp-2 max-w-xl text-sm text-muted-foreground">
                    {v.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
                <Link
                  href={`/admin/villas/${v.slug}/edit`}
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-muted/50"
                >
                  Open full editor
                </Link>
                <form action={approveListing}>
                  <input type="hidden" name="slug" value={v.slug} />
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Approve &amp; publish
                  </button>
                </form>
                <form action={rejectListing} className="flex flex-1 items-center gap-2">
                  <input type="hidden" name="slug" value={v.slug} />
                  <input
                    name="reason"
                    placeholder="Reason (sent to the host)…"
                    className="h-9 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-destructive/40 px-4 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/5"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
