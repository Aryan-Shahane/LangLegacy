"use client";

import { useMemo, useState } from "react";
import PoetryReactionBar from "@/components/poetry/PoetryReactionBar";
import ReportModal from "@/components/ReportModal";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Poem } from "@/lib/types";

export default function PoemCard({
  poem,
  languageCode,
  languageDisplayName,
  translationsLocked,
  viewerUserId,
  viewerCanModerate,
  onReact,
  onGlossRefreshed,
}: {
  poem: Poem;
  languageCode: string;
  languageDisplayName: string;
  translationsLocked: boolean;
  viewerUserId: string | null;
  viewerCanModerate: boolean;
  onReact: (emoji: string) => Promise<void>;
  onGlossRefreshed?: () => Promise<void>;
}) {
  const when = useMemo(() => new Date(poem.created_at).toLocaleString(), [poem.created_at]);
  const glossLooksUntranslated = useMemo(() => {
    if (translationsLocked) return false;
    const a = poem.body_original.replace(/\s+/g, " ").trim();
    const b = (poem.body_translation || "").replace(/\s+/g, " ").trim();
    return a.length > 0 && a === b;
  }, [poem.body_original, poem.body_translation, translationsLocked]);

  const isAuthor =
    !!viewerUserId &&
    typeof poem.author_id === "string" &&
    poem.author_id.length > 0 &&
    poem.author_id === viewerUserId;
  const canRefreshGloss =
    !translationsLocked && !!onGlossRefreshed && (viewerCanModerate || isAuthor);

  const [refreshBusy, setRefreshBusy] = useState(false);
  const [refreshErr, setRefreshErr] = useState<string | null>(null);

  const refreshGloss = async () => {
    if (!canRefreshGloss) return;
    setRefreshErr(null);
    setRefreshBusy(true);
    try {
      const res = await fetch(`/api/poetry/${encodeURIComponent(poem._id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_gloss: true }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Could not refresh glossary.");
      await onGlossRefreshed();
    } catch (e) {
      setRefreshErr(e instanceof Error ? e.message : "Refresh failed.");
    } finally {
      setRefreshBusy(false);
    }
  };

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
            <>
              <p className="text-sm leading-relaxed text-[#434843] whitespace-pre-wrap">{poem.body_translation}</p>
              {glossLooksUntranslated ? (
                <p className="mt-2 text-[11px] leading-relaxed text-[#757C76]">
                  This panel is a dictionary gloss, not a full translator: each word (or multi-word headword) is replaced only
                  when it matches an entry in this language&apos;s Dictionary — spelling, hyphens, and apostrophes must line
                  up. None of these tokens matched yet, so the line is unchanged. Add entries, use the same surface form as
                  in the poem, then use Refresh dictionary gloss.
                </p>
              ) : null}
              {canRefreshGloss ? (
                <div className="mt-3 flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit border-[#C3C8C1]/60 text-[#434843]"
                    disabled={refreshBusy}
                    onClick={() => void refreshGloss()}
                  >
                    {refreshBusy ? "Refreshing…" : "Refresh dictionary gloss"}
                  </Button>
                  {refreshErr ? <p className="text-[11px] text-rose-700">{refreshErr}</p> : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {poem.audio_url ? <AudioPlayer audio_url={poem.audio_url} /> : null}

      <PoetryReactionBar reactions={poem.reactions || {}} onReact={onReact} />
    </Card>
  );
}
