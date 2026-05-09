"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function PostComposer({
  onSubmit,
}: {
  onSubmit: (body: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(text);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#737973]">Community Journal</p>
        <h3 className="mt-1 font-serif text-2xl text-[#061B0E]">Share a voice note, proverb, or reflection</h3>
      </div>
      <Textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a thoughtful contribution for this language circle..."
        className="min-h-28 resize-y leading-relaxed"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#737973]">Keep entries respectful and cite context when possible.</p>
        <Button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="disabled:opacity-50"
        >
          {busy ? "Posting..." : "Publish post"}
        </Button>
      </div>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </Card>
  );
}
