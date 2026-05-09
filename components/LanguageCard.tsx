import Link from "next/link";
import type { Language } from "@/lib/types";

export default function LanguageCard({ language }: { language: Language }) {
  return (
    <Link href={`/${language.code}?tab=dictionary`} className="panel block hover:border-cyan-500">
      <h2 className="text-xl font-semibold">{language.name}</h2>
      <p className="text-slate-400">{language.region || "Unknown region"}</p>
      <p className="mt-2 text-sm">{language.entry_count} entries</p>
    </Link>
  );
}
