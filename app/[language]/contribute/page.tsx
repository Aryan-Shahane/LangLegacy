import Link from "next/link";
import CommunityRecordingFlow from "@/components/CommunityRecordingFlow";
import { getDocument } from "@/lib/cloudant";

export default async function ContributePage({ params }: { params: { language: string } }) {
  const languageDoc = await getDocument("languages", params.language);
  const languageName = typeof languageDoc?.name === "string" ? languageDoc.name : params.language;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-500/90">Community</p>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            Languages
          </Link>
          <span aria-hidden>|</span>
          <Link href={`/${params.language}`} className="hover:text-slate-300">
            Dictionary ({params.language})
          </Link>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-slate-100">Anonymous contribution · {languageName}</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-slate-400">
          Speak or read a targeted word aloud in {languageName}. LangLegacy keeps your browser recording on-device until you publish, pipes it
          through local Whisper transcription, summarizes gloss fields with IBM watsonx for you to tighten, attaches the uncompressed clip to{" "}
          <span className="text-slate-200">one</span> community dictionary row, then forgets whoever submitted it—think of every clip as donating
          a pronunciation sample without attribution metadata.
        </p>
      </div>

      <CommunityRecordingFlow languageCode={params.language} languageName={languageName} />
    </section>
  );
}
