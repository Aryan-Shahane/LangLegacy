"use client";

import { useState } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Story } from "@/lib/types";

function formatDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function StoryPlayer({
  story,
  translationsLocked,
}: {
  story: Story;
  translationsLocked: boolean;
}) {
  const [showTranslation, setShowTranslation] = useState(false);
  const showEnglish = translationsLocked ? false : showTranslation;
  const text = showEnglish ? story.transcript_translation : story.transcript;

  return (
    <Card className="grid gap-4 bg-[rgba(27,48,34,0.06)] p-6 md:grid-cols-2 md:gap-8">
      <div className="space-y-4 rounded-2xl border border-[#C3C8C1]/35 bg-[#FBF9F4] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#737973]">Audio</p>
        {story.audio_url ? (
          <AudioPlayer audio_url={story.audio_url} />
        ) : (
          <p className="text-sm text-[#757C76]">No recording attached.</p>
        )}
        <p className="text-xs text-[#757C76]">Duration · {formatDur(story.duration_seconds || 0)}</p>
      </div>
      <div className="flex max-h-[min(420px,50vh)] flex-col rounded-2xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#737973]">
            {translationsLocked || !showTranslation ? "Original (transcript)" : "Dictionary gloss (English)"}
          </p>
          {!translationsLocked ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowTranslation((v) => !v)}>
              {showTranslation ? "Show transcript" : "Show dictionary English"}
            </Button>
          ) : (
            <p className="text-[11px] text-[#757C76]">English gloss locked · archive mode</p>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[#1B1C19]">
          {text?.trim() || "—"}
        </div>
      </div>
    </Card>
  );
}
