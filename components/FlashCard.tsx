"use client";

import { useEffect, useState } from "react";
import { useExclusivePlayback } from "@/hooks/useExclusivePlayback";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { playEntryPronunciation } from "@/lib/playEntryPronunciation";
import type { Entry } from "@/lib/types";

export default function FlashCard({
  entry,
  onGot,
  onAlmost,
  onMissed,
}: {
  entry: Entry;
  onGot: () => void;
  onAlmost: () => void;
  onMissed: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [pronounceBusy, setPronounceBusy] = useState(false);
  const { toggle, hasAudio } = useExclusivePlayback(entry.audio_url);

  useEffect(() => {
    if (flipped) {
      if (hasAudio && entry.audio_url && entry.word.startsWith("Audio Archive")) {
        const t = window.setTimeout(() => toggle(), 120);
        return () => window.clearTimeout(t);
      } else {
        const t = window.setTimeout(() => {
          setPronounceBusy(true);
          void playEntryPronunciation(entry).finally(() => setPronounceBusy(false));
        }, 120);
        return () => window.clearTimeout(t);
      }
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot autoplay after flip
  }, [flipped, hasAudio, entry.audio_url, entry.word, entry.phonetic, entry.language_code]);

  const frontTranslation = entry.translation?.trim() || entry.definition?.trim() || "—";
  const phoneticLine = entry.phonetic?.trim() || "";

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div className="relative h-[340px]" style={{ perspective: "1400px" }}>
        <div
          className="relative h-full w-full transition-transform duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-10 text-left shadow-sm outline-none transition hover:bg-[#EFEDE8] focus-visible:ring-2 focus-visible:ring-[#9F4026]/40"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <p className="mb-6 text-xs uppercase tracking-[0.35em] text-[#757C76]">English cue</p>
            <div className="flex flex-1 flex-col justify-center">
              <p className="text-center font-serif text-[2.125rem] leading-snug tracking-tight text-[#061B0E]">{frontTranslation}</p>
            </div>
            <p className="text-center text-[11px] text-[#737973]">
              Tap whenever you recall the endangered-language phrase — the card will flip to reveal pronunciation and audio.
            </p>
          </button>

          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-[#C3C8C1]/35 bg-[#FBF9F4] p-10 shadow-inner"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-[#757C76]">Language side</p>
            <div className="flex flex-1 flex-col justify-center gap-4 text-center">
              <span className="font-serif text-5xl tracking-tight text-[#061B0E]">{entry.word}</span>
              {phoneticLine ? <span className="text-sm italic text-[#757C76]">{phoneticLine}</span> : null}
              {(hasAudio && entry.audio_url && entry.word.startsWith("Audio Archive")) ? (
                <AudioPlayer audio_url={entry.audio_url} />
              ) : (
                <button
                  key="tts-btn"
                  type="button"
                  disabled={pronounceBusy}
                  onClick={async () => {
                    setPronounceBusy(true);
                    try {
                      await playEntryPronunciation(entry);
                    } finally {
                      setPronounceBusy(false);
                    }
                  }}
                  className="mx-auto mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#C3C8C1]/60 bg-white px-4 py-1.5 text-sm font-semibold text-[#1B3022] transition-colors hover:bg-[#E5F0E8] disabled:cursor-wait disabled:opacity-70"
                >
                  {pronounceBusy ? "… Playing…" : "🔊 Pronounce"}
                </button>
              )}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                type="button"
                className="min-w-[6.75rem] border-rose-400/55 text-rose-800 hover:bg-[#FFDAD6]"
                onClick={() => onMissed()}
              >
                Missed
              </Button>
              <Button
                variant="outline"
                type="button"
                className="min-w-[6.75rem] border-amber-300/75 text-amber-900 hover:bg-amber-50"
                onClick={() => onAlmost()}
              >
                Almost
              </Button>
              <Button type="button" className="min-w-[6.75rem] bg-[#1B3022] hover:bg-[#0F1F15]" onClick={() => onGot()}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      </div>

      {!flipped ? (
        <p className="text-center text-xs text-[#757C76]">
          Think of how you would pronounce the endangered-language wording before flipping.
        </p>
      ) : (
        <p className="text-center text-[11px] text-[#737973]">
          Mark honestly — missed cards shuffle back into the deck; “Almost” slips this card slightly later in the queue.
        </p>
      )}
    </div>
  );
}
