"use client";

import { useEffect, useState } from "react";
import { suggestKeywordsFromTranscript } from "@/components/community/suggestKeywordsFromTranscript";
import TranscriptionProgressBar from "@/components/community/TranscriptionProgressBar";
import { useAudioTranscription } from "@/components/community/useAudioTranscription";
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
  const [suggestedWords, setSuggestedWords] = useState<string[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);

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
  } = useAudioTranscription(languageCode);

  useEffect(() => {
    if (transcript.trim()) setOriginal(transcript);
  }, [transcript]);

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

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/poetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language_code: languageCode,
          title: title.trim() || "Untitled poem",
          body_original: original.trim(),
          audio_url: audioUrl ?? undefined,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Could not publish poem.");
      }
      setTitle("");
      setOriginal("");
      setSuggestedWords([]);
      resetAudio();
      setTranscript("");
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
      <p className="text-xs uppercase tracking-[0.2em] text-[#737973]">Share a poem</p>
      <p className="text-[11px] leading-relaxed text-[#757C76]">
        {translationsLocked ? (
          "This archive is in archive mode — poems stay in the original language here; dictionary English glosses appear after the language graduates to full mode."
        ) : (
          <>
            {`After you publish, an English dictionary gloss appears under your poem: each word is swapped only when it matches an entry in this archive (${languageDisplayName}) dictionary (not full-sentence machine translation).`}{" "}
            <span className="font-medium text-[#434843]">
              Record or upload audio — we run the same Whisper transcription as the Dictionary upload flow, then suggest vocabulary keywords from your transcript (Dictionary extract pipeline).
            </span>{" "}
            After you add or change Dictionary entries, open your poem in the list below and use{" "}
            <span className="font-medium text-[#434843]">Refresh dictionary gloss</span> under the English line to recompute it.
          </>
        )}
      </p>

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
                Stop &amp; transcribe
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
          {audioUrl ? `${audioFileLabel} · audio saved` : "Processing failed — try again"}
        </p>
      ) : null}
      {audioOnlyInfo ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">{audioOnlyInfo}</p>
      ) : null}

      {suggestedWords.length > 0 || keywordsLoading ? (
        <div className="rounded-lg border border-[#C3C8C1]/35 bg-[#FBF9F4] p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#757C76]">
            Keywords from transcript {keywordsLoading ? "(loading…)" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedWords.map((w) => (
              <button
                key={w}
                type="button"
                className="rounded-full border border-[#C3C8C1]/60 bg-[#F5F3EE] px-3 py-1 text-xs text-[#1B3022] hover:border-[#1B3022]/40"
                onClick={() => setTitle((t) => (t.trim() ? `${t.trim()} · ${w}` : w))}
              >
                + {w}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-[#757C76]">Tap a chip to use it in the title (you can edit).</p>
        </div>
      ) : null}

      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-[#FBF9F4]"
      />
      <Textarea
        placeholder={`Poem in ${languageDisplayName} — or use record/upload above to fill from speech`}
        rows={6}
        value={original}
        onChange={(e) => setOriginal(e.target.value)}
        className="bg-[#FBF9F4] font-serif"
      />

      {combinedError ? <p className="text-xs text-rose-700">{combinedError}</p> : null}
      <Button
        type="button"
        className="bg-[#1B3022]"
        disabled={busy || transcribing || isRecording || !original.trim()}
        onClick={() => void submit()}
      >
        {busy ? "Publishing..." : "Publish poem"}
      </Button>
    </Card>
  );
}
