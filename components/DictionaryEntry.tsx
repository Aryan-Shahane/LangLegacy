"use client";

import { useState } from "react";
import ReportModal from "@/components/ReportModal";
import AudioPlayer from "@/components/AudioPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { entryHasMeaningfulTranslation } from "@/lib/entryTranslation";
import type { Entry } from "@/lib/types";

export default function DictionaryEntry({
  entry,
  onTranslationSaved,
}: {
  entry: Entry;
  canModerate?: boolean;
  onTranslationSaved?: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);

  const created = entry.created_at
    ? new Date(entry.created_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  const definitionPrimary = entry.definition?.trim() || null;
  const legacyGloss = [entry.part_of_speech, entry.phonetic].filter(Boolean).join(" · ").trim();

  const contributorLabel = entry.contributor_name ? `Contributed by ${entry.contributor_name}` : "Community";

  const needsTranslation = !entryHasMeaningfulTranslation(entry);

  const submitTranslation = async () => {
    const value = draft.trim();
    if (!value) return;
    setBusy(true);
    setPatchError(null);
    try {
      const res = await fetch(`/api/entries/${encodeURIComponent(entry._id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translation: value }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || `Could not save (${res.status})`);
      }
      setAdding(false);
      setDraft("");
      onTranslationSaved?.();
    } catch (e) {
      setPatchError(e instanceof Error ? e.message : "Could not save translation.");
    } finally {
      setBusy(false);
    }
  };

  const deleteEntry = async () => {
    if (!confirm("Are you sure you want to delete this word?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/entries/${encodeURIComponent(entry._id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      onTranslationSaved?.();
    } catch (e) {
      alert("Could not delete entry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="panel space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#C3C8C1]/40 pb-3">
        <div>
          <h3 className="font-serif text-3xl text-[#061B0E]">{entry.word}</h3>
          <p className="text-lg text-[#1B1C19]">{entry.translation}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canModerate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={() => void deleteEntry()}
              disabled={busy}
            >
              Delete
            </Button>
          )}
          <ReportModal compact contentType="entry" contentId={entry._id} languageCode={entry.language_code} />
        </div>
      </div>

      {definitionPrimary ? <p className="text-sm leading-relaxed text-[#434843]">{definitionPrimary}</p> : null}
      {!definitionPrimary && legacyGloss ? <p className="text-sm text-[#434843]">{legacyGloss}</p> : null}

      {entry.example_sentence ? (
        <p className="text-sm italic text-[#802A11]">
          {entry.example_sentence}
          {entry.example_translation ? ` (${entry.example_translation})` : ""}
        </p>
      ) : null}

      {needsTranslation ? (
        <div className="space-y-2 rounded-xl border border-dashed border-[#C3C8C1]/55 bg-[#FAF9F6] px-3 py-2">
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="text-sm font-semibold text-[#1B3022] underline underline-offset-2 hover:text-[#9F4026]"
            >
              Add translation +
            </button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={draft}
                disabled={busy}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="English translation"
                className="sm:max-w-md"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" disabled={busy || !draft.trim()} onClick={() => void submitTranslation()}>
                  {busy ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setAdding(false);
                    setDraft("");
                    setPatchError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {patchError ? <p className="text-xs text-rose-700">{patchError}</p> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {entry.audio_url ? (
          <AudioPlayer audio_url={entry.audio_url} />
        ) : (
          <button
            type="button"
            onClick={() => {
              const textToSpeak = entry.phonetic || entry.word;
              const utter = new SpeechSynthesisUtterance(textToSpeak);
              utter.lang = entry.language_code;
              window.speechSynthesis.speak(utter);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C3C8C1]/60 bg-white px-4 py-1.5 text-sm font-semibold text-[#1B3022] hover:bg-[#E5F0E8] transition-colors"
          >
            🔊 Pronounce
          </button>
        )}
        <Badge className="bg-[#F0EEE9] text-[#434843]">{entry.source === "community" ? "Community" : "Archive"}</Badge>
      </div>

      <p className="text-xs text-[#757C76]">
        {contributorLabel}
        {created ? ` · ${created}` : ""}
      </p>
    </article>
  );
}
