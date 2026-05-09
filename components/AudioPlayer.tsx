"use client";

import { Button } from "@/components/ui/button";
import { useExclusivePlayback } from "@/hooks/useExclusivePlayback";

type Props = {
  audio_url: string | null;
};

export default function AudioPlayer({ audio_url }: Props) {
  const { toggle, isPlaying, hasAudio } = useExclusivePlayback(audio_url);

  if (!hasAudio) {
    return <p className="text-sm text-[#737973]">No audio recording yet</p>;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-[#9F4026]/40 bg-[#FFDBD1]/30 text-[#802A11] hover:bg-[#FFDBD1]/50"
      onClick={() => toggle()}
      aria-label={isPlaying ? "Pause pronunciation" : "Play pronunciation"}
    >
      {isPlaying ? "❚❚ Pause" : "▶ Play audio"}
    </Button>
  );
}
