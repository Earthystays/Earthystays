import { getCategories } from "@/lib/data/experience-categories";
import { CategoriesAdmin } from "./categories-editor";

export const metadata = { title: "Experience categories · Admin" };

export default function AdminCategoriesPage() {
  const categories = getCategories();
  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Experience categories</h1>
        <p className="mt-2 text-muted-foreground">
          Categories power the experience filters and card badges. Icons use
          lucide-react names (e.g. UtensilsCrossed, Mountain, Camera).
        </p>
      </header>
      <CategoriesAdmin initial={categories} />
    </div>
  );
}
