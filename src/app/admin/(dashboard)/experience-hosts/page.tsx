import { getHosts } from "@/lib/data/experience-hosts";
import { HostsAdmin } from "./hosts-editor";

export const metadata = { title: "Experience hosts · Admin" };

export default function AdminHostsPage() {
  const hosts = getHosts();
  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Experience hosts</h1>
        <p className="mt-2 text-muted-foreground">
          A reusable host table — one host can front many experiences. Assign a
          host to an experience from the experience editor.
        </p>
      </header>
      <HostsAdmin initial={hosts} />
    </div>
  );
}
