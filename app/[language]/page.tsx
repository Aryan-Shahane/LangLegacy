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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dictionary: {dictionaryTitle}</h1>
        <Link href={`/${params.language}/contribute`} className="rounded bg-cyan-700 px-3 py-2">
          Contribute
        </Link>
      </div>
      <DictionaryClient languageCode={params.language} />
    </section>
  );
}
