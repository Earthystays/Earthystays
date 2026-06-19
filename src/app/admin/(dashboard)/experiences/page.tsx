import { getAllExperiences } from "@/lib/data/experiences";
import { ExperiencesEditor } from "./editor";

export const metadata = { title: "Experiences · Admin" };

export default function AdminExperiencesPage() {
  const items = getAllExperiences();

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Curated experiences</h1>
        <p className="mt-2 text-muted-foreground">
          Premium concierge offerings shown on the home page and at
          /experiences. Edit cover photos, rename, or add brand-new
          experiences.
        </p>
      </header>

      <ExperiencesEditor initial={items} />
    </div>
  );
}
