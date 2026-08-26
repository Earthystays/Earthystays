import { getAllAuthors } from "@/lib/data/journal-authors";
import { AuthorsEditor } from "./editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Authors · Journal" };

export default function JournalAuthorsPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl">Authors</h1>
        <p className="mt-2 text-muted-foreground">
          Bylines shown on articles. Assign an author from the article editor.
        </p>
      </header>
      <AuthorsEditor initial={getAllAuthors()} />
    </div>
  );
}
