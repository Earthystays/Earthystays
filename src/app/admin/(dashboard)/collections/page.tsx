import { getAllCollections } from "@/lib/data/collections";
import { CollectionsEditor } from "./editor";

export const metadata = { title: "Collections · Admin" };

export default function AdminCollectionsPage() {
  const collections = getAllCollections();

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Collections</h1>
        <p className="mt-2 text-muted-foreground">
          Curated themes (Pool Villas, Pet Friendly, etc.) — change the cover
          photo, rename, or add brand-new collections. Each collection groups
          villas tagged with its slug.
        </p>
      </header>

      <CollectionsEditor initial={collections} />
    </div>
  );
}
