import Link from "next/link";
import { getDocument } from "@/lib/cloudant";
import type { Language } from "@/lib/types";
import DictionaryClient from "./DictionaryClient";

export default async function LanguageDictionaryPage({
  params,
}: {
  params: { language: string };
}) {
  const languageDoc = (await getDocument("languages", params.language)) as Language | null;
  const dictionaryTitle = languageDoc?.name
    ? `${languageDoc.name} (${languageDoc.code})`
    : params.language;

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Dictionary · {dictionaryTitle}</h1>
          <Link
            href={`/${params.language}/contribute`}
            className="rounded bg-cyan-700 px-3 py-2 text-sm hover:bg-cyan-600"
          >
            Contribute audio
          </Link>
        </div>
        <p className="max-w-prose text-sm leading-relaxed text-slate-400">
          Loaded entries stream in pages so the whole lexicon stays approachable. Matches fire against endangered-language lemmas{" "}
          <span className="text-slate-300">or</span> plain English translations. Audio tiles respond to clicks for instant playback whenever a
          Cloudinary-hosted clip exists.
        </p>
      </div>
      <DictionaryClient languageCode={params.language} />
    </section>
  );
}
