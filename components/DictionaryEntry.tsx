"use client";

import type { KeyboardEvent } from "react";
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
      className={`panel space-y-2 outline-none ring-cyan-500/40 transition ${
        hasAudio
          ? "cursor-pointer hover:border-cyan-600 hover:bg-slate-900 focus-visible:ring-2"
          : "opacity-95"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <h3 className="text-lg font-semibold">{entry.word}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-700 px-2 py-1 text-xs">{entry.part_of_speech || "other"}</span>
          <span
            className={`rounded px-2 py-1 text-xs ${
              hasAudio ? "bg-cyan-900/60 text-cyan-100" : "bg-slate-800 text-slate-500"
            }`}
          >
            {pronunciationHint}
          </span>
        </div>
      </div>
      {entry.phonetic ? <p className="text-sm text-slate-400">{entry.phonetic}</p> : null}
      <p>{entry.translation}</p>
      {entry.example_sentence ? (
        <p className="text-sm italic text-slate-300">
          {entry.example_sentence}
          {entry.example_translation ? ` (${entry.example_translation})` : ""}
        </p>
      ) : null}
      <span className="rounded bg-slate-800 px-2 py-1 text-xs">
        {entry.source === "community" ? "Community" : "Archive"}
      </span>
    </article>
  );
}
