"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import type { ExtractedEntry } from "@/lib/types";

type Step = "record" | "uploading_audio" | "transcribing" | "extracting" | "review" | "saving" | "done";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result as string;
      const base64 = data.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function emptyEntry(): ExtractedEntry {
  return {
    word: "",
    translation: "",
    definition: "",
    phonetic: "",
    part_of_speech: "other",
    example_sentence: "",
    example_translation: "",
  };
}

export default function CommunityRecordingFlow({
  languageCode,
  languageName,
}: {
  languageCode: string;
  languageName: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("record");
  const [error, setError] = useState<string | null>(null);
  const [duplicateBanner, setDuplicateBanner] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState<ExtractedEntry>(emptyEntry);

  const reset = () => {
    setStep("record");
    setError(null);
    setDuplicateBanner(null);
    setRecordingBlob(null);
    setTranscript("");
    setDraft(emptyEntry());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runPipeline = async (blob: Blob) => {
    setRecordingBlob(blob);
    setError(null);
    setDuplicateBanner(null);
    setStep("uploading_audio");

    const fd = new FormData();
    const file = blob instanceof File ? blob : new File([blob], "recording.webm", { type: blob.type || "audio/webm" });
    fd.append("audio", file);
    fd.append("language_code", languageCode);

    setStep("transcribing");
    const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: fd });
    const transcribeJson = (await transcribeRes.json()) as { transcript?: string; error?: string };
    if (!transcribeRes.ok) {
      const msg =
        transcribeJson.error ||
        (transcribeRes.status === 502
          ? "Audio upload failed. Please try again."
          : "Transcription server unavailable.");
      setError(msg);
      setStep("record");
      return;
    }

    const text = transcribeJson.transcript?.trim() || "";
    setTranscript(text);
    setStep("extracting");

    const extractRes = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: text || `(${languageName} speech — transcription empty; please fill glosses manually.)`,
        language_name: languageName,
        language_code: languageCode,
      }),
    });
    const extractJson = (await extractRes.json()) as { entries?: ExtractedEntry[]; error?: string };
    if (!extractRes.ok) {
      setError(extractJson.error || "Vocabulary extraction failed.");
      setDraft(emptyEntry());
      setStep("review");
      return;
    }

    const first = extractJson.entries?.[0];
    if (first) {
      setDraft({
        word: first.word || "",
        translation: first.translation || "",
        definition: first.definition ?? "",
        phonetic: first.phonetic ?? "",
        part_of_speech: first.part_of_speech || "other",
        example_sentence: first.example_sentence ?? "",
        example_translation: first.example_translation ?? "",
      });
    } else {
      setDraft(emptyEntry());
    }
    setStep("review");
  };

  const saveEntry = async (skipDuplicateGuard: boolean) => {
    if (!recordingBlob) {
      setError("No recording.");
      return;
    }
    const wordTrim = draft.word.trim();
    if (!wordTrim) {
      setError("Word / phrase is required before publishing.");
      return;
    }
    setError(null);
    setDuplicateBanner(null);
    setStep("saving");

    try {
      if (!skipDuplicateGuard) {
        const probeRes = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duplicate_probe: true,
            language_code: languageCode,
            word: wordTrim,
            translation: draft.translation.trim(),
          }),
        });
        const probeJson = (await probeRes.json()) as {
          duplicate_warning?: boolean;
          message?: string;
        };
        if (probeRes.ok && probeJson.duplicate_warning) {
          setDuplicateBanner(
            probeJson.message ||
              "Possible duplicate entry detected.\nWould you like to merge or create a new entry?"
          );
          setStep("review");
          return;
        }
      }

      const audio_base64 = await blobToBase64(recordingBlob);
      const payload = {
        language_code: languageCode,
        word: wordTrim,
        translation: draft.translation.trim() || "community contribution",
        definition: draft.definition?.trim() || null,
        phonetic: (draft.phonetic ?? "").trim() || null,
        part_of_speech: (draft.part_of_speech ?? "").trim() || null,
        example_sentence: (draft.example_sentence ?? "").trim() || null,
        example_translation: (draft.example_translation ?? "").trim() || null,
        source: "community" as const,
        audio_base64,
        audio_type: recordingBlob.type || "audio/webm",
      };
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) {
        throw new Error(typeof j?.error === "string" ? j.error : `Save failed (${res.status})`);
      }
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setStep("review");
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</p>
      ) : null}
      {duplicateBanner ? (
        <div className="rounded-md border border-amber-700/70 bg-amber-950/30 px-3 py-2 text-sm text-amber-100 whitespace-pre-line">
          {duplicateBanner}
        </div>
      ) : null}

      {step === "uploading_audio" ? (
        <div className="panel text-sm text-slate-300">Uploading audio...</div>
      ) : null}

      {step === "transcribing" ? <div className="panel text-sm text-slate-300">Transcribing speech...</div> : null}

      {step === "extracting" ? <div className="panel text-sm text-slate-300">Extracting vocabulary...</div> : null}

      {step === "record" ? (
        <div className="space-y-3">
          <div className="panel space-y-2">
            <p className="text-xs text-slate-500">
              Supported upload formats include <span className="text-slate-300">.mp3</span>,{" "}
              <span className="text-slate-300">.wav</span>, and <span className="text-slate-300">.m4a</span>.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,audio/mp3,audio/wav,audio/x-m4a,audio/m4a,audio/*"
              className="block w-full cursor-pointer rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-300"
              onChange={(e) => {
                const list = e.target.files;
                if (list?.[0]) void runPipeline(list[0]);
              }}
            />
          </div>
          <AudioRecorder onRecordingComplete={(blob) => void runPipeline(blob)} />
        </div>
      ) : null}

      {step === "review" || step === "saving" ? (
        <div className="panel space-y-3">
          <p className="text-xs text-slate-500">Transcript</p>
          <p className="text-sm text-slate-200">{transcript || "(empty)"}</p>
          <p className="text-sm text-slate-400">
            Review Watsonx suggestions, tighten translations, confirm definitions, then publish to Cloudant with your authenticated
            contributor profile attached.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate-500">
              Word / phrase
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"
                value={draft.word}
                onChange={(e) => setDraft((d) => ({ ...d, word: e.target.value }))}
              />
            </label>
            <label className="text-xs text-slate-500">
              Part of speech
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"
                value={draft.part_of_speech || ""}
                onChange={(e) => setDraft((d) => ({ ...d, part_of_speech: e.target.value }))}
              />
            </label>
          </div>
          <label className="text-xs text-slate-500">
            Definition / cultural gloss
            <textarea
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
              rows={3}
              value={draft.definition || ""}
              onChange={(e) => setDraft((d) => ({ ...d, definition: e.target.value }))}
            />
          </label>
          <label className="text-xs text-slate-500">
            Phonetic
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"
              value={draft.phonetic || ""}
              onChange={(e) => setDraft((d) => ({ ...d, phonetic: e.target.value }))}
            />
          </label>
          <label className="text-xs text-slate-500">
            Translation / gloss
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"
              value={draft.translation}
              onChange={(e) => setDraft((d) => ({ ...d, translation: e.target.value }))}
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate-500">
              Example sentence
              <textarea
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                rows={2}
                value={draft.example_sentence || ""}
                onChange={(e) => setDraft((d) => ({ ...d, example_sentence: e.target.value }))}
              />
            </label>
            <label className="text-xs text-slate-500">
              Example translation
              <textarea
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                rows={2}
                value={draft.example_translation || ""}
                onChange={(e) => setDraft((d) => ({ ...d, example_translation: e.target.value }))}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={step === "saving"}
              onClick={() => void saveEntry(false)}
              className="rounded bg-emerald-700 px-3 py-2 text-sm hover:bg-emerald-600 disabled:opacity-50"
            >
              {step === "saving" ? "Publishing…" : "Publish entry"}
            </button>
            {duplicateBanner ? (
              <button
                type="button"
                disabled={step === "saving"}
                onClick={() => void saveEntry(true)}
                className="rounded border border-amber-500/70 px-3 py-2 text-sm text-amber-100 hover:bg-amber-900/40 disabled:opacity-50"
              >
                Create anyway
              </button>
            ) : null}
            <button type="button" onClick={reset} className="rounded border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">
              Start over
            </button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="panel space-y-2">
          <p className="font-medium text-slate-100">Dictionary entry saved.</p>
          <Link className="text-cyan-300 underline hover:text-cyan-200" href={`/${languageCode}`}>
            Open dictionary
          </Link>
          <button type="button" onClick={reset} className="ml-4 text-sm text-slate-400 underline hover:text-slate-300">
            Contribute another
          </button>
        </div>
      ) : null}
    </div>
  );
}
