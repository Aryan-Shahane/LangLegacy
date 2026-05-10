"use client";

import { useEffect, useMemo, useState } from "react";
import { suggestKeywordsFromTranscript } from "@/components/community/suggestKeywordsFromTranscript";
import TranscriptionProgressBar from "@/components/community/TranscriptionProgressBar";
import { useAudioTranscription } from "@/components/community/useAudioTranscription";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Language } from "@/lib/types";

export default function StoryComposer({
  languageCode,
  languageDisplayName: languageDisplayNameProp,
  translationsLocked,
  onCreated,
}: {
  languageCode: string;
  /** For `/api/extract` — falls back to resolved name from `/api/languages`. */
  languageDisplayName?: string;
  translationsLocked: boolean;
  onCreated: () => Promise<void>;
}) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedWords, setSuggestedWords] = useState<string[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);

  const languageDisplayName = useMemo(() => {
    if (languageDisplayNameProp?.trim()) return languageDisplayNameProp.trim();
    const code = languageCode.trim().toLowerCase();
    const hit = languages.find((l) => l.code.trim().toLowerCase() === code);
    return hit?.name?.trim() || languageCode.trim().toUpperCase() || "this language";
  }, [languageDisplayNameProp, languages, languageCode]);

  useEffect(() => {
    let m = true;
    void fetch("/api/languages", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((json) => {
        if (m && Array.isArray(json)) setLanguages(json as Language[]);
      })
      .catch(() => {});
    return () => {
      m = false;
    };
  }, []);

  const {
    transcribing,
    transcribeProgress,
    transcribePhaseLabel,
    transcript,
    setTranscript,
    audioUrl,
    audioFileLabel,
    audioOnlyInfo,
    error: transcribeError,
    isRecording,
    recordElapsedSec,
    processAudioFile,
    startRecording,
    stopRecording,
    cancelRecording,
    resetAudio,
    durationSeconds,
  } = useAudioTranscription(languageCode);

  useEffect(() => {
    const t = transcript.trim();
    if (!t) {
      setSuggestedWords([]);
      return;
    }
    let cancelled = false;
    setKeywordsLoading(true);
    void (async () => {
      try {
        const words = await suggestKeywordsFromTranscript(t, languageCode, languageDisplayName);
        if (!cancelled) setSuggestedWords(words);
      } catch {
        if (!cancelled) setSuggestedWords([]);
      } finally {
        if (!cancelled) setKeywordsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [transcript, languageCode, languageDisplayName]);

  const onFileChosen = async (file: File | null) => {
    if (!file) {
      resetAudio();
      setTranscript("");
      return;
    }
    await processAudioFile(file, file.name);
  };

  const appendTag = (w: string) => {
    setTags((prev) => {
      const parts = prev.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.some((p) => p.toLowerCase() === w.toLowerCase())) return prev;
      return [...parts, w].join(", ");
    });
  };

  const submit = async () => {
    if (!audioUrl) {
      setError("Add a recording and wait for upload to finish (transcript can be typed if Whisper did not return text).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language_code: languageCode,
          title: title.trim(),
          description:
            description.trim() ||
            (transcript.trim() ? transcript.trim().slice(0, 200) : "Audio story from the community archive."),
          transcript: transcript.trim(),
          duration_seconds: durationSeconds,
          tags: tagList,
          audio_url: audioUrl,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Could not save story.");
      }
      setTitle("");
      setDescription("");
      setTags("");
      resetAudio();
      setTranscript("");
      setSuggestedWords([]);
      await onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const combinedError = error || transcribeError;

  return (
    <Card className="space-y-3 bg-[#F5F3EE] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[#737973]">Add a storytelling recording</p>
      <p className="text-[11px] leading-relaxed text-[#757C76]">
        Record or upload audio — same Whisper step as Dictionary contributions. Transcript is editable. After text exists, we run the Dictionary keyword extract (`/api/extract`) so you can add chips as tags.
        {translationsLocked
          ? " Dictionary English glosses for stories stay locked until this language reaches full archive mode."
          : " The English panel comes from your archive dictionary."}
      </p>
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[#FBF9F4]" />
      <Textarea
        placeholder="Short description"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-[#FBF9F4]"
      />

      <div className="flex flex-col gap-3 rounded-lg border border-[#C3C8C1]/35 bg-[#FBF9F4] p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {!isRecording ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#9F4026]"
              disabled={transcribing || busy || isRecording}
              onClick={() => void startRecording()}
            >
              Record
            </Button>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => cancelRecording()}>
                Cancel
              </Button>
              <Button type="button" size="sm" className="bg-[#1B3022]" disabled={busy} onClick={() => stopRecording()}>
                Stop &amp; use recording
              </Button>
              <span className="rounded-full bg-rose-100 px-3 py-1 font-mono text-xs font-semibold text-rose-900">
                ● {fmt(recordElapsedSec)}
              </span>
            </>
          )}
        </div>
        <div className="min-w-[200px] flex-1 border-t border-[#C3C8C1]/35 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <label className="text-xs font-medium text-[#434843]">
            Or upload audio
            <input
              type="file"
              accept="audio/*"
              className="mt-1 block w-full text-sm text-[#434843] file:mr-3 file:rounded-full file:border-0 file:bg-[#1B3022] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#FBF9F4]"
              disabled={transcribing || isRecording}
              onChange={(e) => {
                const f = e.target.files?.[0];
                void onFileChosen(f ?? null);
              }}
            />
          </label>
        </div>
      </div>

      {transcribing ? (
        <TranscriptionProgressBar percent={transcribeProgress} phaseLabel={transcribePhaseLabel} />
      ) : null}
      {audioFileLabel && !transcribing ? (
        <p className="text-[11px] text-[#757C76]">
          {audioUrl ? `${audioFileLabel} · ~${durationSeconds}s` : "Processing failed — try again"}
        </p>
      ) : null}
      {audioOnlyInfo ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">{audioOnlyInfo}</p>
      ) : null}

      {audioUrl ? (
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-[0.12em] text-[#757C76]">Transcript</label>
          <Textarea
            rows={5}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Whisper fills this when supported; otherwise type what was said."
            className="bg-[#FBF9F4] font-serif text-sm leading-relaxed text-[#1B1C19]"
          />
        </div>
      ) : null}

      {suggestedWords.length > 0 || keywordsLoading ? (
        <div className="rounded-lg border border-[#C3C8C1]/35 bg-[#FBF9F4] p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#757C76]">
            Suggested tags from transcript {keywordsLoading ? "(loading…)" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedWords.map((w) => (
              <button
                key={w}
                type="button"
                className="rounded-full border border-[#C3C8C1]/60 bg-[#F5F3EE] px-3 py-1 text-xs text-[#1B3022] hover:border-[#1B3022]/40"
                onClick={() => appendTag(w)}
              >
                + {w}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <Input placeholder="Tags, comma-separated" value={tags} onChange={(e) => setTags(e.target.value)} className="bg-[#FBF9F4]" />

      {combinedError ? <p className="text-xs text-rose-700">{combinedError}</p> : null}
      <Button
        type="button"
        className="bg-[#1B3022]"
        disabled={busy || transcribing || !audioUrl || isRecording}
        onClick={() => void submit()}
      >
        {busy ? "Saving..." : "Save story"}
      </Button>
    </Card>
  );
}
