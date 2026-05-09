"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PoemComposer({
  languageCode,
  languageDisplayName,
  translationsLocked,
  onCreated,
}: {
  languageCode: string;
  languageDisplayName: string;
  translationsLocked: boolean;
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [original, setOriginal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/poetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language_code: languageCode,
          title: title.trim(),
          body_original: original.trim(),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Could not publish poem.");
      }
      setTitle("");
      setOriginal("");
      await onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  };

  const poemPlaceholder = `Poem in ${languageDisplayName}`;

  return (
    <Card className="space-y-3 bg-[#F5F3EE] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[#737973]">Share a poem</p>
      <p className="text-[11px] leading-relaxed text-[#757C76]">
        {translationsLocked
          ? "This archive is in archive mode — poems stay in the original language here; dictionary English glosses appear after the language graduates to full mode."
          : `After you publish, English appears under your poem automatically, using word matches from this archive (${languageDisplayName}) dictionary.`}
      </p>
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-[#FBF9F4]"
      />
      <Textarea
        placeholder={poemPlaceholder}
        rows={5}
        value={original}
        onChange={(e) => setOriginal(e.target.value)}
        className="bg-[#FBF9F4] font-serif"
      />
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
      <Button type="button" className="bg-[#1B3022]" disabled={busy} onClick={() => void submit()}>
        {busy ? "Publishing..." : "Publish poem"}
      </Button>
    </Card>
  );
}
