"use client";

import { useState } from "react";
import { useExclusivePlayback } from "@/hooks/useExclusivePlayback";
import type { Entry } from "@/lib/types";

export default function FlashCard({
  entry,
  onRate,
}: {
  entry: Entry;
  onRate: (score: "missed" | "almost" | "got") => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const { toggle, isPlaying, hasAudio } = useExclusivePlayback(entry.audio_url);

  return (
    <div className="panel space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">Flashcard</p>
      <p className="text-2xl font-semibold text-slate-100">{entry.word}</p>
      {entry.phonetic ? <p className="text-sm text-slate-400">{entry.phonetic}</p> : null}
      {hasAudio ? (
        <button
          type="button"
          onClick={() => toggle()}
          className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
        >
          {isPlaying ? "Pause audio" : "Play audio"}
        </button>
      ) : null}

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded bg-cyan-700 px-3 py-2 text-sm hover:bg-cyan-600"
        >
          Show answer
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-lg text-slate-100">{entry.translation}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setRevealed(false);
                onRate("missed");
              }}
              className="rounded bg-rose-700 px-3 py-1.5 text-sm"
            >
              ✗ Missed
            </button>
            <button
              type="button"
              onClick={() => {
                setRevealed(false);
                onRate("almost");
              }}
              className="rounded bg-amber-700 px-3 py-1.5 text-sm"
            >
              ~ Almost
            </button>
            <button
              type="button"
              onClick={() => {
                setRevealed(false);
                onRate("got");
              }}
              className="rounded bg-emerald-700 px-3 py-1.5 text-sm"
            >
              ✓ Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
