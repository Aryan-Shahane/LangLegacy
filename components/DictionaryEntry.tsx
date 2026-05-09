"use client";

import ReportModal from "@/components/ReportModal";
import AudioPlayer from "@/components/AudioPlayer";
import { Badge } from "@/components/ui/badge";
import type { Entry } from "@/lib/types";

export default function DictionaryEntry({ entry }: { entry: Entry }) {
  const created = entry.created_at
    ? new Date(entry.created_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  const definitionPrimary = entry.definition?.trim() || null;
  const legacyGloss = [entry.part_of_speech, entry.phonetic].filter(Boolean).join(" · ").trim();

  const contributorLabel = entry.contributor_name ? `Contributed by ${entry.contributor_name}` : "Community";

  return (
    <article className="panel space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#C3C8C1]/40 pb-3">
        <div>
          <h3 className="font-serif text-3xl text-[#061B0E]">{entry.word}</h3>
          <p className="text-lg text-[#1B1C19]">{entry.translation}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportModal
            compact
            onSubmit={async (payload) => {
              await fetch(`/api/entries/${entry._id}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, language_code: entry.language_code }),
              });
            }}
          />
        </div>
      </div>

      {definitionPrimary ? <p className="text-sm leading-relaxed text-[#434843]">{definitionPrimary}</p> : null}
      {!definitionPrimary && legacyGloss ? <p className="text-sm text-[#434843]">{legacyGloss}</p> : null}

      {entry.example_sentence ? (
        <p className="text-sm italic text-[#802A11]">
          {entry.example_sentence}
          {entry.example_translation ? ` (${entry.example_translation})` : ""}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <AudioPlayer audio_url={entry.audio_url} />
        <Badge className="bg-[#F0EEE9] text-[#434843]">{entry.source === "community" ? "Community" : "Archive"}</Badge>
      </div>

      <p className="text-xs text-[#757C76]">
        {contributorLabel}
        {created ? ` · ${created}` : ""}
      </p>
    </article>
  );
}
