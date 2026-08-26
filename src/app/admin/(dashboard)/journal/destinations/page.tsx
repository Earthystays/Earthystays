import { getAllJournalDestinations } from "@/lib/data/journal-destinations";
import { getBlockEditorOptions } from "@/lib/journal/admin-options";
import { DestinationsEditor } from "./editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Destinations · Journal" };

export default function JournalDestinationsPage() {
  const { properties, experiences } = getBlockEditorOptions();
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl">Destinations</h1>
        <p className="mt-2 text-muted-foreground">
          The localities featured in the Journal (Morjim, Anjuna…). Link each to
          live properties and experiences — they resolve automatically, never copied.
        </p>
      </header>
      <DestinationsEditor
        initial={getAllJournalDestinations()}
        properties={properties}
        experiences={experiences}
      />
    </div>
  );
}
