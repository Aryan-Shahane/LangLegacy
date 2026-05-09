import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Language } from "@/lib/types";
import { formatRelativeTime } from "@/lib/formatRelative";

export default function LanguageCard({ language }: { language: Language }) {
  const activity = language.updated_at || language.created_at;
  const speakerLine =
    typeof language.speaker_count === "number"
      ? `${language.speaker_count.toLocaleString()} speakers`
      : null;

  return (
    <Link href={`/${language.code}`} className="block">
      <Card className="h-full space-y-2 p-5 transition-all hover:-translate-y-0.5 hover:border-[#9F4026]/35">
        <div>
          <h2 className="font-serif text-2xl text-[#061B0E]">{language.name}</h2>
          <p className="text-[#434843]">{language.region || "Unknown region"}</p>
          {speakerLine ? <p className="text-sm text-[#5A665F]">{speakerLine}</p> : null}
          <p className="mt-2 text-sm text-[#061B0E]">
            {language.entry_count.toLocaleString()} entr{language.entry_count === 1 ? "y" : "ies"}
          </p>
          <p className="text-sm text-[#434843]">
            {typeof language.contributor_count === "number"
              ? `${language.contributor_count.toLocaleString()} contributor${language.contributor_count === 1 ? "" : "s"}`
              : "0 contributors"}
          </p>
          {activity ? (
            <p className="text-xs uppercase tracking-wide text-[#757C76]">Updated {formatRelativeTime(activity)}</p>
          ) : (
            <p className="text-xs uppercase tracking-wide text-[#757C76]">Updated —</p>
          )}
        </div>
        <div className="mt-2 rounded-full bg-[#1B3022] py-3 text-center text-sm font-semibold text-[#FBF9F4]">
          Open Dictionary
        </div>
      </Card>
    </Link>
  );
}
