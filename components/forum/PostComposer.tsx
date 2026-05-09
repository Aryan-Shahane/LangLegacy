"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function PostComposer({
  title,
  onSubmit,
}: {
  title?: string;
  onSubmit: (body: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(body);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to publish.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 bg-[#F5F3EE] p-5">
      {title ? <p className="text-xs uppercase tracking-[0.2em] text-[#737973]">{title}</p> : null}
      <Textarea
        rows={4}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Share a phrase, pronunciation note, or story from the language…"
        className="border-[#C3C8C1]/35 bg-[#FBF9F4]"
      />
      <div className="flex items-center justify-between gap-3">
        {error ? <p className="text-xs text-rose-700">{error}</p> : <span />}
        <Button type="button" className="bg-[#1B3022]" disabled={busy} onClick={() => void submit()}>
          {busy ? "Publishing..." : "Post to forum"}
        </Button>
      </div>
    </Card>
  );
}
