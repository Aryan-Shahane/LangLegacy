import Link from "next/link";
import { getSessionFromCookie } from "@/lib/auth";
import AppNav from "@/components/AppNav";
import { getDocument } from "@/lib/cloudant";
import type { Language } from "@/lib/types";
import LanguageTabsPanel from "@/components/LanguageTabsPanel";

export default async function LanguageDictionaryPage({
  params,
}: {
  params: { language: string };
}) {
  const languageDoc = (await getDocument("languages", params.language)) as Language | null;
  const viewer = await getSessionFromCookie();
  const dictionaryTitle = languageDoc?.name
    ? `${languageDoc.name} (${languageDoc.code})`
    : params.language;

  return (
    <section className="space-y-4">
      <AppNav />
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
          Explore this language across dictionary, community discussion, chat rooms, and learning sessions. Search supports endangered-language
          terms and English translations, while community moderation tools keep shared content healthy.
        </p>
      </div>
      <LanguageTabsPanel languageCode={params.language} viewerRole={viewer?.role || "user"} />
    </section>
  );
}
