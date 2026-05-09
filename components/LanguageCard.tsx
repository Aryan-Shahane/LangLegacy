import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Language } from "@/lib/types";

export default function LanguageCard({ language }: { language: Language }) {
  return (
    <Link href={`/${language.code}?tab=dictionary`} className="block">
      <Card className="p-4 transition-all hover:-translate-y-0.5 hover:border-[#9F4026]/35">
        <h2 className="font-serif text-2xl text-[#061B0E]">{language.name}</h2>
        <p className="text-[#434843]">{language.region || "Unknown region"}</p>
        <p className="mt-2 text-sm text-[#434843]">{language.entry_count} entries</p>
      </Card>
    </Link>
  );
}
