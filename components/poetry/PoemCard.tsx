"use client";

import { useMemo } from "react";
import PoetryReactionBar from "@/components/poetry/PoetryReactionBar";
import ReportModal from "@/components/ReportModal";
import AudioPlayer from "@/components/AudioPlayer";
import { Card } from "@/components/ui/card";
import type { Poem } from "@/lib/types";

export default function PoemCard({
  poem,
  languageCode,
  languageDisplayName,
  translationsLocked,
  onReact,
}: {
  poem: Poem;
  languageCode: string;
  languageDisplayName: string;
  translationsLocked: boolean;
  onReact: (emoji: string) => Promise<void>;
}) {
  const when = useMemo(() => new Date(poem.created_at).toLocaleString(), [poem.created_at]);

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl text-[#061B0E]">{poem.title}</h3>
          <p className="text-sm text-[#434843]">
            {poem.author_name}
            <span className="text-[#757C76]"> · {when}</span>
          </p>
        </div>
        <ReportModal compact contentType="poem" contentId={poem._id} languageCode={languageCode} />
      </div>

      <div className="rounded-lg border border-[#C3C8C1]/35 bg-[#F5F3EE] p-4">
        <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[#757C76]">{languageDisplayName}</p>
        <p className="font-serif text-lg leading-relaxed text-[#1B1C19] whitespace-pre-wrap">{poem.body_original}</p>
        <div className="mt-4 border-t border-[#C3C8C1]/35 pt-4">
          <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[#757C76]">English (dictionary gloss)</p>
          {translationsLocked ? (
            <p className="text-sm italic leading-relaxed text-[#757C76]">
              Locked in archive mode — English glossary lines unlock when translation coverage grows and this language switches to full mode.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-[#434843] whitespace-pre-wrap">{poem.body_translation}</p>
          )}
        </div>
      </div>

      {poem.audio_url ? <AudioPlayer audio_url={poem.audio_url} /> : null}

      <PoetryReactionBar reactions={poem.reactions || {}} onReact={onReact} />
    </Card>
  );
}
