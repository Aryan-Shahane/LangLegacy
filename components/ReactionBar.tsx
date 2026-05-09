"use client";

import { useState } from "react";

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
    <div className="flex flex-wrap gap-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          disabled={busy === emoji}
          onClick={() => void handleReact(emoji)}
          className="rounded-full border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800 disabled:opacity-50"
        >
          {emoji} {reactions[emoji] || 0}
        </button>
      ))}
    </div>
  );
}
