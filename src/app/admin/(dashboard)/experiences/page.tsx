import { getAllExperiences } from "@/lib/data/experiences";
import { getHosts } from "@/lib/data/experience-hosts";
import { getCategories } from "@/lib/data/experience-categories";
import { getExperienceViewCountsSync } from "@/lib/data/experience-views";
import { ExperiencesAdmin } from "./editor";

export const metadata = { title: "Experiences · Admin" };

export default function AdminExperiencesPage() {
  const experiences = getAllExperiences();
  const categories = getCategories();
  const hosts = getHosts();
  const views = getExperienceViewCountsSync();

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Experiences</h1>
        <p className="mt-2 text-muted-foreground">
          Create and manage the host-led experiences shown at /experiences.
          Draft, publish, duplicate, and edit every field — hero, itinerary,
          host, inclusions, gallery and FAQs.
        </p>
      </header>

      <ExperiencesAdmin
        experiences={experiences}
        categories={categories}
        hosts={hosts}
        views={views}
      />
    </div>
  );
}
