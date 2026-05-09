"use client";

import type { KeyboardEvent } from "react";
import ReportModal from "@/components/ReportModal";
import { Badge } from "@/components/ui/badge";
import type { Entry } from "@/lib/types";
import { useExclusivePlayback } from "@/hooks/useExclusivePlayback";

export default function DictionaryEntry({ entry }: { entry: Entry }) {
  const { isPlaying, toggle, hasAudio } = useExclusivePlayback(entry.audio_url);

  const pronunciationHint = !hasAudio
    ? "No audio recording yet"
    : isPlaying
      ? "Playing — click to pause"
      : "Click this entry to hear the pronunciation";

  const cardProps =
    !hasAudio
      ? {}
      : {
          role: "button" as const,
          tabIndex: 0 as const,
          "aria-label": `Dictionary entry ${entry.word}. Press to play pronunciation.`,
          onClick: () => toggle(),
          onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          },
        };

  return (
    <article
      {...cardProps}
      className={`panel space-y-2 outline-none ring-[#9F4026]/40 transition ${hasAudio ? "cursor-pointer hover:border-[#9F4026]/40 focus-visible:ring-2" : "opacity-95"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C3C8C1]/40 pb-2">
        <h3 className="font-serif text-3xl text-[#061B0E]">{entry.word}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-[#D0E9D4] text-[#0B2013]">{entry.part_of_speech || "other"}</Badge>
          <Badge className={hasAudio ? "bg-[#FFDBD1] text-[#802A11]" : "bg-[#F0EEE9] text-[#737973]"}>
            {pronunciationHint}
          </Badge>
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
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
      </div>
      {entry.phonetic ? <p className="text-sm text-[#434843]">{entry.phonetic}</p> : null}
      <p className="text-[#1B1C19]">{entry.translation}</p>
      {entry.example_sentence ? (
        <p className="text-sm italic text-[#802A11]">
          {entry.example_sentence}
          {entry.example_translation ? ` (${entry.example_translation})` : ""}
        </p>
      ) : null}
      <Badge className="w-fit bg-[#F0EEE9] text-[#434843]">
        {entry.source === "community" ? "Community" : "Archive"}
      </Badge>
    </article>
  );
}
