import LanguageCard from "@/components/LanguageCard";
import { getAllDocuments } from "@/lib/cloudant";
import type { Language } from "@/lib/types";

async function getLanguages(): Promise<Language[]> {
  try {
    return (await getAllDocuments("languages")) as Language[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const languages = await getLanguages();

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">LangLegacy</h1>
      <p className="text-slate-300">Living dictionaries for endangered languages.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {languages.map((language) => (
          <LanguageCard key={language._id} language={language} />
        ))}
      </div>
      {!languages.length ? (
        <p className="text-sm text-amber-300">No languages found. Seed Cloudant first.</p>
      ) : null}
    </section>
  );
}
