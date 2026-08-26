import { getAllCampaigns } from "@/lib/data/journal-campaigns";
import { getBlockEditorOptions, getArticleOptions } from "@/lib/journal/admin-options";
import { CampaignsEditor } from "./editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campaigns · Journal" };

export default function JournalCampaignsPage() {
  const { properties, experiences } = getBlockEditorOptions();
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl">Seasonal campaigns</h1>
        <p className="mt-2 text-muted-foreground">
          Run time-boxed campaigns (Monsoon in Goa, New Year, Long Weekends…). A
          live campaign shows a banner at the top of the Journal homepage between
          its start and end dates, then disappears automatically.
        </p>
      </header>
      <CampaignsEditor
        initial={getAllCampaigns()}
        articles={getArticleOptions()}
        properties={properties}
        experiences={experiences}
      />
    </div>
  );
}
