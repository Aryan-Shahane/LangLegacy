"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "🙌", "👏", "🔥"];

export default function ReactionBar({
  reactions,
  onReact,
}: {
  reactions: Record<string, number>;
  onReact: (emoji: string) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const handleReact = async (emoji: string) => {
    setBusy(emoji);
    try {
      await onReact(emoji);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 border-t border-[#C3C8C1]/40 pt-3">
      {EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          type="button"
          size="sm"
          variant="outline"
          disabled={busy === emoji}
          onClick={() => void handleReact(emoji)}
          className={cn("min-w-16 justify-center text-xs disabled:opacity-50", reactions[emoji] ? "border-[#9F4026]/35 bg-[#FFDBD1]/35" : "")}
        >
          {emoji} {reactions[emoji] || 0}
        </Button>
      ))}
    </div>
  );
}
