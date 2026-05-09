"use client";

import { useMemo } from "react";
import ReportModal from "@/components/ReportModal";
import StoryReactionBar from "@/components/storytelling/StoryReactionBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Story } from "@/lib/types";

function formatDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function StoryCard({
  story,
  languageCode,
  onListen,
  onReact,
}: {
  story: Story;
  languageCode: string;
  onListen: () => void;
  onReact: (emoji: string) => Promise<void>;
}) {
  const when = useMemo(() => new Date(story.created_at).toLocaleString(), [story.created_at]);
  const desc = story.description.length > 140 ? `${story.description.slice(0, 137)}…` : story.description;

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl text-[#061B0E]">{story.title}</h3>
          <p className="text-sm text-[#434843]">
            {story.author_name}
            <span className="text-[#757C76]"> · {when}</span>
          </p>
        </div>
        <ReportModal compact contentType="story" contentId={story._id} languageCode={languageCode} />
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-[#434843]">{desc}</p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#E8EFE9] px-3 py-1 text-xs font-medium text-[#1B3022]">
          {formatDur(story.duration_seconds || 0)}
        </span>
        {story.tags?.length
          ? story.tags.map((t) => (
              <span key={t} className="rounded-full border border-[#C3C8C1]/35 px-2 py-0.5 text-[11px] text-[#434843]">
                {t}
              </span>
            ))
          : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C3C8C1]/35 pt-3">
        <StoryReactionBar reactions={story.reactions || {}} onReact={onReact} />
        <Button type="button" size="sm" className="bg-[#9F4026]" onClick={onListen}>
          Listen
        </Button>
      </div>
    </Card>
  );
}
