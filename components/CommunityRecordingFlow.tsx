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

  const [audioOnlyInfo, setAudioOnlyInfo] = useState<string | null>(null);

  const reset = () => {
    setStep("record");
    setError(null);
    setDuplicateBanner(null);
    setAudioOnlyInfo(null);
    setRecordingBlob(null);
    setTranscript("");
    setDraft(emptyEntry());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runPipeline = async (blob: Blob) => {
    setRecordingBlob(blob);
    setError(null);
    setDuplicateBanner(null);
    setAudioOnlyInfo(null);
    setStep("uploading_audio");

    const fd = new FormData();
    const file = blob instanceof File ? blob : new File([blob], "recording.webm", { type: blob.type || "audio/webm" });
    fd.append("audio", file);
    fd.append("language_code", languageCode);

    setStep("transcribing");
    const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: fd });
    const transcribeJson = (await transcribeRes.json()) as {
      transcript?: string;
      error?: string;
      audio_only?: boolean;
      audio_only_reason?: string;
    };
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

    // If language is not supported by Whisper, skip extraction — go straight to manual entry
    if (transcribeJson.audio_only) {
      setTranscript("");
      setAudioOnlyInfo(
        transcribeJson.audio_only_reason ||
        "This language is not supported by automatic transcription. Your audio has been saved — please fill in the word details manually."
      );
      setDraft(emptyEntry());
      setStep("review");
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
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm">{error}</p>
      ) : null}
      {duplicateBanner ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm whitespace-pre-line">
          {duplicateBanner}
        </div>
      ) : null}

      {step === "uploading_audio" ? (
        <div className="rounded-xl border border-[#C3C8C1]/50 bg-white p-6 text-sm text-[#434843] shadow-sm flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#B24A2D] border-r-transparent" />
          Uploading audio...
        </div>
      ) : null}

      {step === "transcribing" ? (
        <div className="rounded-xl border border-[#C3C8C1]/50 bg-white p-6 text-sm text-[#434843] shadow-sm flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#B24A2D] border-r-transparent" />
          Transcribing speech locally...
        </div>
      ) : null}

      {step === "extracting" ? (
        <div className="rounded-xl border border-[#C3C8C1]/50 bg-white p-6 text-sm text-[#434843] shadow-sm flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#B24A2D] border-r-transparent" />
          Extracting vocabulary via watsonx...
        </div>
      ) : null}

      {step === "record" ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#C3C8C1]/50 bg-white p-6 shadow-sm space-y-3">
            <h3 className="font-serif text-lg text-[#061B0E]">Upload Audio File</h3>
            <p className="text-xs text-[#5A665F]">
              Supported upload formats include <span className="font-medium text-[#1B3022]">.mp3</span>,{" "}
              <span className="font-medium text-[#1B3022]">.wav</span>, and <span className="font-medium text-[#1B3022]">.m4a</span>.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,audio/mp3,audio/wav,audio/x-m4a,audio/m4a,audio/*"
              className="block w-full cursor-pointer rounded-lg border border-[#C3C8C1]/60 bg-[#F5F4F0] px-3 py-2 text-sm text-[#434843] file:mr-4 file:rounded-full file:border-0 file:bg-[#E5F0E8] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#1B3022] hover:file:bg-[#D0E0D5]"
              onChange={(e) => {
                const list = e.target.files;
                if (list?.[0]) void runPipeline(list[0]);
              }}
            />
          </div>
          <div className="rounded-xl border border-[#C3C8C1]/50 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-serif text-lg text-[#061B0E]">Or Record Live</h3>
            <AudioRecorder onRecordingComplete={(blob) => void runPipeline(blob)} />
          </div>
        </div>
      ) : null}

      {step === "review" || step === "saving" ? (
        <div className="rounded-xl border border-[#C3C8C1]/50 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-serif text-xl text-[#061B0E]">
              {audioOnlyInfo ? "Manual Entry" : "Review Extraction"}
            </h3>
            <p className="mt-1 text-sm text-[#5A665F]">
              {audioOnlyInfo
                ? "Fill in the word details below. Your audio recording has been saved."
                : "Review Watsonx suggestions, tighten translations, confirm definitions, then publish to Cloudant."}
            </p>
          </div>

          {audioOnlyInfo ? (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-900">{audioOnlyInfo}</p>
            </div>
          ) : (
            <div className="rounded-lg bg-[#F5F4F0] p-4 border border-[#C3C8C1]/40">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A3620] mb-1">Generated Transcript</p>
              <p className="text-sm font-medium text-[#061B0E]">{transcript || "(empty)"}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                Word / phrase
                <input
                  className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
                  value={draft.word}
                  onChange={(e) => setDraft((d) => ({ ...d, word: e.target.value }))}
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                Part of speech
                <input
                  className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
                  value={draft.part_of_speech || ""}
                  onChange={(e) => setDraft((d) => ({ ...d, part_of_speech: e.target.value }))}
                />
              </label>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
              Definition / cultural gloss
              <textarea
                className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
                rows={3}
                value={draft.definition || ""}
                onChange={(e) => setDraft((d) => ({ ...d, definition: e.target.value }))}
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
              Phonetic
              <input
                className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
                value={draft.phonetic || ""}
                onChange={(e) => setDraft((d) => ({ ...d, phonetic: e.target.value }))}
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
              Translation / gloss
              <input
                className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
                value={draft.translation}
                onChange={(e) => setDraft((d) => ({ ...d, translation: e.target.value }))}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                Example sentence
                <textarea
                  className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
                  rows={2}
                  value={draft.example_sentence || ""}
                  onChange={(e) => setDraft((d) => ({ ...d, example_sentence: e.target.value }))}
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                Example translation
                <textarea
                  className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
                  rows={2}
                  value={draft.example_translation || ""}
                  onChange={(e) => setDraft((d) => ({ ...d, example_translation: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-[#E3DFD6]">
            <button
              type="button"
              disabled={step === "saving"}
              onClick={() => void saveEntry(false)}
              className="rounded-full bg-[#B24A2D] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#8A3620] disabled:opacity-50 transition-colors"
            >
              {step === "saving" ? "Publishing…" : "Publish Entry"}
            </button>
            {duplicateBanner ? (
              <button
                type="button"
                disabled={step === "saving"}
                onClick={() => void saveEntry(true)}
                className="rounded-full bg-[#FCE8E3] px-6 py-2.5 text-sm font-bold text-[#8A3620] hover:bg-[#F5D5CC] disabled:opacity-50 transition-colors"
              >
                Create Anyway
              </button>
            ) : null}
            <button type="button" onClick={reset} className="rounded-full border border-[#C3C8C1] bg-white px-6 py-2.5 text-sm font-semibold text-[#434843] hover:bg-[#F5F4F0] transition-colors">
              Start Over
            </button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="rounded-xl border border-[#C3C8C1]/50 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F0E8] text-[#1B3022] mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-serif text-2xl text-[#061B0E] mb-2">Dictionary entry saved!</h3>
          <p className="text-[#5A665F] mb-6">Your contribution has been successfully archived.</p>
          <div className="flex justify-center gap-4">
            <Link className="rounded-full bg-[#1B3022] px-6 py-2.5 text-sm font-bold text-[#FBF9F4] hover:bg-[#061B0E] transition-colors" href={`/${languageCode}`}>
              Back to Dictionary
            </Link>
            <button type="button" onClick={reset} className="rounded-full border border-[#C3C8C1] bg-white px-6 py-2.5 text-sm font-semibold text-[#434843] hover:bg-[#F5F4F0] transition-colors">
              Contribute Another
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
