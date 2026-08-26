import { getAllCategories } from "@/lib/data/journal-categories";
import { CategoriesEditor } from "./editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories · Journal" };

export default function JournalCategoriesPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl">Categories</h1>
        <p className="mt-2 text-muted-foreground">
          Create, rename, reorder and toggle the categories shown across the Journal.
          Drag order controls the “Explore by category” row on the homepage.
        </p>
      </header>
      <CategoriesEditor initial={getAllCategories()} />
    </div>
  );
}
