import { getHomepage } from "@/lib/data/journal-homepage";
import { getBlockEditorOptions } from "@/lib/journal/admin-options";
import { HomepageEditor } from "./editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage · Journal" };

export default function JournalHomepageAdmin() {
  const { properties, experiences, destinations } = getBlockEditorOptions();
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl">Journal homepage</h1>
        <p className="mt-2 text-muted-foreground">
          Control every section of the public Journal homepage — content, order and visibility.
        </p>
      </header>
      <HomepageEditor
        initial={getHomepage()}
        properties={properties}
        experiences={experiences}
        destinations={destinations}
      />
    </div>
  );
}
