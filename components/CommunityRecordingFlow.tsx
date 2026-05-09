"use client";

import Link from "next/link";
import { useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import type { ExtractedEntry } from "@/lib/types";

type Step = "record" | "transcribing" | "extracting" | "review" | "saving" | "done";

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
    phonetic: "",
    translation: "",
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
  const [step, setStep] = useState<Step>("record");
  const [error, setError] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState<ExtractedEntry>(emptyEntry);

  const reset = () => {
    setStep("record");
    setError(null);
    setRecordingBlob(null);
    setTranscript("");
    setDraft(emptyEntry());
  };

  const runPipeline = async (blob: Blob) => {
    setRecordingBlob(blob);
    setError(null);
    setStep("transcribing");

    const file = new File([blob], "community.webm", { type: blob.type || "audio/webm" });
    const fd = new FormData();
    fd.append("audio", file);
    fd.append("language_code", languageCode);

    const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: fd });
    const transcribeJson = (await transcribeRes.json()) as { transcript?: string; error?: string };
    if (!transcribeRes.ok) {
      setError(transcribeJson.error || `Transcription failed (${transcribeRes.status})`);
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
      setError(extractJson.error || `Extraction failed (${extractRes.status})`);
      setDraft(emptyEntry());
      setStep("review");
      return;
    }

    const first = extractJson.entries?.[0];
    if (first) {
      setDraft({
        word: first.word || "",
        phonetic: first.phonetic ?? "",
        translation: first.translation || "",
        part_of_speech: first.part_of_speech || "other",
        example_sentence: first.example_sentence ?? "",
        example_translation: first.example_translation ?? "",
      });
    } else {
      setDraft(emptyEntry());
    }
    setStep("review");
  };

  const saveEntry = async () => {
    if (!recordingBlob) {
      setError("No recording.");
      return;
    }
    setError(null);
    setStep("saving");
    try {
      const audio_base64 = await blobToBase64(recordingBlob);
      const payload = {
        language_code: languageCode,
        word: draft.word.trim() || "community recording",
        phonetic: (draft.phonetic ?? "").trim() || null,
        translation: draft.translation.trim() || "community contribution",
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

      {(step === "transcribing" || step === "extracting") && (
        <div className="panel text-sm text-slate-300">
          {step === "transcribing"
            ? "Transcribing with local Whisper..."
            : "IBM watsonx is extracting vocabulary..."}
          <p className="mt-2 text-xs text-slate-500">This usually takes several seconds.</p>
        </div>
      )}
      {step === "record" ? (
        <AudioRecorder onRecordingComplete={(blob) => void runPipeline(blob)} />
      ) : null}

      {step === "review" || step === "saving" ? (
        <div className="panel space-y-3">
          <p className="text-xs text-slate-500">Transcript</p>
          <p className="text-sm text-slate-200">{transcript || "(empty)"}</p>
          <p className="text-sm text-slate-400">
            Review gloss details, tighten translations, then publish anonymously—only the clipped audio and lexical fields reach Cloudant +
            Cloudinary without any contributor identifiers.
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
              onClick={() => void saveEntry()}
              className="rounded bg-emerald-700 px-3 py-2 text-sm hover:bg-emerald-600 disabled:opacity-50"
            >
              {step === "saving" ? "Publishing…" : "Publish entry"}
            </button>
            <button type="button" onClick={reset} className="rounded border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">
              Start over
            </button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="panel space-y-2">
          <p className="font-medium text-slate-100">Anonymous community entry published.</p>
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
