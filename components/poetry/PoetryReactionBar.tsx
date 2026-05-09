"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "🌿", "✨", "🙏"];

export default function PoetryReactionBar({
  reactions,
  onReact,
}: {
  reactions: Record<string, string[]>;
  onReact: (emoji: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const counts: Record<string, number> = {};
  for (const [emoji, ids] of Object.entries(reactions)) counts[emoji] = ids?.length ?? 0;

  return (
    <div className="flex flex-wrap gap-2 border-t border-[#C3C8C1]/35 pt-3">
      {EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          type="button"
          size="sm"
          variant="outline"
          disabled={busy === emoji}
          onClick={async () => {
            setBusy(emoji);
            try {
              await onReact(emoji);
            } finally {
              setBusy(null);
            }
          }}
          className={cn(
            "min-w-14 justify-center text-xs",
            counts[emoji] ? "border-emerald-800/35 bg-emerald-100/60" : ""
          )}
        >
          {emoji} {counts[emoji] || 0}
        </Button>
      ))}
    </div>
  );
}
