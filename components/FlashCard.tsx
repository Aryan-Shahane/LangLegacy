"use client";

import { useState } from "react";
import { useExclusivePlayback } from "@/hooks/useExclusivePlayback";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  const definitionPeek = entry.definition?.trim() || entry.phonetic || null;

  return (
    <div className="space-y-6">
      <Card className="relative mx-auto max-w-xl border-[#C3C8C1]/35 bg-[#F5F3EE] p-10 text-center">
        <h1 className="font-serif text-5xl tracking-tight text-[#061B0E]">{entry.word}</h1>
        {hasAudio ? (
          <button
            type="button"
            onClick={() => toggle()}
            className="mx-auto mt-5 grid h-12 w-12 place-content-center rounded-full bg-[#9F4026] text-white transition-transform active:scale-95"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? "❚❚" : "🔊"}
          </button>
        ) : null}

        <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-[#C3C8C1]/45 to-transparent" />

        {revealed ? (
          <div className="space-y-3">
            <p className="font-serif text-2xl italic text-[#9F4026]">{entry.translation}</p>
            {entry.definition?.trim() ? (
              <p className="mx-auto max-w-md text-sm leading-relaxed text-[#434843]">{entry.definition.trim()}</p>
            ) : null}
            {entry.example_sentence ? (
              <p className="mx-auto max-w-md text-sm leading-relaxed text-[#434843]">
                “{entry.example_sentence}”
                {entry.example_translation ? ` — ${entry.example_translation}` : ""}
              </p>
            ) : (
              <p className="mx-auto max-w-md text-sm leading-relaxed text-[#434843]">
                Tap a rating below to continue your session.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {definitionPeek ? <p className="text-sm text-[#434843]">{definitionPeek}</p> : null}
            <Button variant="outline" onClick={() => setRevealed(true)} className="mx-auto">
              Show answer
            </Button>
          </div>
        )}
      </Card>

      {revealed ? (
        <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-4">
          <Button
            variant="outline"
            className="h-12 w-40 justify-center border-rose-400/50 text-rose-700 hover:bg-[#FFDAD6]"
            onClick={() => {
              setRevealed(false);
              onRate("missed");
            }}
          >
            ✕ Missed
          </Button>
          <Button
            variant="outline"
            className="h-12 w-40 justify-center border-[#737973]/40 text-[#434843] hover:bg-[#EAE8E3]"
            onClick={() => {
              setRevealed(false);
              onRate("almost");
            }}
          >
            ~ Almost
          </Button>
          <Button
            className="h-12 w-40 justify-center bg-[#1B3022] text-white hover:bg-[#061B0E]"
            onClick={() => {
              setRevealed(false);
              onRate("got");
            }}
          >
            ✓ Got it
          </Button>
        </div>
      ) : null}
    </div>
  );
}
