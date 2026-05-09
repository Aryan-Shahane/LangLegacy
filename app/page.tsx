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
  const languages = [...(await getLanguages())].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-500/90">Community</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-100">Endangered-language dictionaries</h1>
        <p className="mt-2 max-w-prose leading-relaxed text-slate-300">
          Visitors pick a revitalization project, skim the searchable archive glosses, audition community pronunciations, and record a
          new word directly in-browser. Nothing asks for identities—community uploads stay&nbsp;
          <span className="text-slate-200">anonymous</span>. Archival teams run the Whisper → watsonx ingest against private recordings at the
          guarded <code className="text-amber-200/90">/admin</code> route (bookmark it; public navigation hides that surface on purpose).
        </p>
        <ul className="mt-4 list-disc space-y-2 ps-6 text-sm text-slate-300">
          <li>Browse endangered languages seeded in IBM Cloudant.</li>
          <li>Open a dictionary, search bilingual glosses (target language ↔ English).</li>
          <li>Activate any audible entry tile to replay its recording.</li>
          <li>Jump into Contribute inside a language workspace to stash one more anonymously sourced clip.</li>
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {languages.map((language) => (
          <LanguageCard key={language._id} language={language} />
        ))}
      </div>
      {!languages.length ? (
        <p className="text-sm text-amber-300">No endangered languages surfaced yet — seed IBM Cloudant first.</p>
      ) : null}
    </section>
  );
}
