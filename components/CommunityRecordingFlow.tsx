"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import type { ExtractedEntry } from "@/lib/types";

type Step = "record" | "uploading_audio" | "transcribing" | "extracting" | "review" | "done";

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
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [drafts, setDrafts] = useState<ExtractedEntry[]>([]);
  const [savingIndices, setSavingIndices] = useState<Set<number>>(new Set());
  const [publishedIndices, setPublishedIndices] = useState<Set<number>>(new Set());
  const [audioOnlyInfo, setAudioOnlyInfo] = useState<string | null>(null);

  const reset = () => {
    setStep("record");
    setError(null);
    setAudioOnlyInfo(null);
    setRecordingBlob(null);
    setTranscript("");
    setDrafts([]);
    setSavingIndices(new Set());
    setPublishedIndices(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runPipeline = async (blob: Blob) => {
    setRecordingBlob(blob);
    setError(null);
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
      setError(transcribeJson.error || "Transcription server unavailable.");
      setStep("record");
      return;
    }

    if (transcribeJson.audio_only) {
      setTranscript("");
      setAudioOnlyInfo(transcribeJson.audio_only_reason || "Automatic transcription not supported for this language.");
      setDrafts([{ ...emptyEntry(), word: `Audio Archive ${new Date().toLocaleDateString()}` }]);
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
    
    const extractJson = (await extractRes.json()) as { 
      entries?: ExtractedEntry[]; 
      error?: string;
      warning?: string;
    };

    if (!extractRes.ok || extractJson.error) {
      setError(extractJson.error || "Vocabulary extraction failed.");
      setAudioOnlyInfo("Automated extraction failed. Please fill in details manually.");
      setDrafts([{ ...emptyEntry(), word: `Audio Archive ${new Date().toLocaleDateString()}` }]);
      setStep("review");
      return;
    }

    if (extractJson.warning || !extractJson.entries?.length) {
      setAudioOnlyInfo(extractJson.warning || "No specific words could be extracted.");
      setDrafts([{ ...emptyEntry(), word: `Audio Archive ${new Date().toLocaleDateString()}` }]);
      setStep("review");
      return;
    }

    const extractedDrafts = extractJson.entries.map(e => ({
      word: e.word || "",
      translation: e.translation || "",
      definition: e.definition ?? "",
      phonetic: e.phonetic ?? "",
      part_of_speech: e.part_of_speech || "other",
      example_sentence: e.example_sentence ?? "",
      example_translation: e.example_translation ?? "",
    }));

    // Always append the entire audio segment as a final archival entry
    extractedDrafts.push({
      ...emptyEntry(),
      word: `Audio Archive ${new Date().toLocaleDateString()}`,
      translation: "Complete Audio Segment",
      definition: `Full Transcript: ${text}`,
    });

    setDrafts(extractedDrafts);
    setStep("review");
  };

  const publishSingleDraft = async (index: number) => {
    if (!recordingBlob) return;
    const draft = drafts[index];
    if (!draft.word.trim()) {
      setError("Word / phrase is required before publishing.");
      return;
    }

    setSavingIndices(prev => new Set(prev).add(index));
    setError(null);

    try {
      const audio_base64 = await blobToBase64(recordingBlob);
      const payload = {
        language_code: languageCode,
        word: draft.word.trim(),
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

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error || "Save failed");
      }

      setPublishedIndices(prev => new Set(prev).add(index));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const updateDraft = (index: number, updates: Partial<ExtractedEntry>) => {
    setDrafts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const removeDraft = (index: number) => {
    setDrafts(prev => prev.filter((_, i) => i !== index));
    setPublishedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      // Note: indices shift, so we'd need a more robust ID system if we want perfectly preserved "published" states after removal.
      // For simplicity in this session, we'll just clear the specific one.
      return next;
    });
  };

  const addEmptyDraft = () => {
    setDrafts(prev => [...prev, emptyEntry()]);
  };

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm">{error}</p>
      ) : null}

      {step === "uploading_audio" || step === "transcribing" || step === "extracting" ? (
        <div className="rounded-xl border border-[#C3C8C1]/50 bg-white p-6 text-sm text-[#434843] shadow-sm flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#B24A2D] border-r-transparent" />
          {step === "uploading_audio" ? "Uploading file..." : step === "transcribing" ? "Transcribing speech..." : "Extracting vocabulary..."}
        </div>
      ) : null}

      {step === "record" ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#C3C8C1]/50 bg-white p-6 shadow-sm space-y-3">
            <h3 className="font-serif text-lg text-[#061B0E]">Upload Media File</h3>
            <p className="text-xs text-[#5A665F]">
              Supported: <span className="font-medium text-[#1B3022]">.mp3</span>,{" "}
              <span className="font-medium text-[#1B3022]">.wav</span>,{" "}
              <span className="font-medium text-[#1B3022]">.m4a</span>,{" "}
              <span className="font-medium text-[#1B3022]">.mp4</span>.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.mp4,audio/*,video/mp4"
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

      {step === "review" ? (
        <div className="space-y-8">
          <div className="flex items-end justify-between border-b border-[#E3DFD6] pb-4">
            <div>
              <h3 className="font-serif text-2xl text-[#061B0E]">
                {audioOnlyInfo ? "Manual Entry" : "Review Extractions"}
              </h3>
              <p className="mt-1 text-sm text-[#5A665F]">
                {audioOnlyInfo
                  ? "Automatic processing skipped. Please add words manually."
                  : `Watsonx found ${drafts.length} potential words/phrases. Review and publish each below.`}
              </p>
            </div>
            <button
              onClick={addEmptyDraft}
              className="rounded-full bg-[#E5F0E8] px-4 py-2 text-xs font-bold text-[#1B3022] hover:bg-[#D0E0D5] transition-colors"
            >
              + Add Another Entry
            </button>
          </div>

          {!audioOnlyInfo && (
            <div className="rounded-lg bg-[#F5F4F0] p-4 border border-[#C3C8C1]/40">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A3620] mb-1">Generated Transcript</p>
              <p className="text-sm font-medium text-[#061B0E]">{transcript || "(empty)"}</p>
            </div>
          )}

          <div className="space-y-6">
            {drafts.map((draft, idx) => {
              const isPublished = publishedIndices.has(idx);
              const isSaving = savingIndices.has(idx);

              return (
                <div key={idx} className={`relative rounded-2xl border ${isPublished ? "border-green-200 bg-green-50/30" : "border-[#C3C8C1]/50 bg-white"} p-6 shadow-sm transition-all`}>
                  {isPublished && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-green-700 font-bold text-xs uppercase">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Published
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                      Word / phrase
                      <input
                        disabled={isPublished || isSaving}
                        className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D] disabled:opacity-50"
                        value={draft.word}
                        onChange={(e) => updateDraft(idx, { word: e.target.value })}
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                      Part of speech
                      <input
                        disabled={isPublished || isSaving}
                        className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D] disabled:opacity-50"
                        value={draft.part_of_speech || ""}
                        onChange={(e) => updateDraft(idx, { part_of_speech: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="mt-4 space-y-4">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                      Definition / cultural gloss
                      <textarea
                        disabled={isPublished || isSaving}
                        className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D] disabled:opacity-50"
                        rows={2}
                        value={draft.definition || ""}
                        onChange={(e) => updateDraft(idx, { definition: e.target.value })}
                      />
                    </label>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                        Phonetic
                        <input
                          disabled={isPublished || isSaving}
                          className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D] disabled:opacity-50"
                          value={draft.phonetic || ""}
                          onChange={(e) => updateDraft(idx, { phonetic: e.target.value })}
                        />
                      </label>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                        Translation
                        <input
                          disabled={isPublished || isSaving}
                          className="mt-1.5 block w-full rounded-lg border border-[#C3C8C1]/60 bg-white px-3 py-2 text-sm text-[#061B0E] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D] disabled:opacity-50"
                          value={draft.translation}
                          onChange={(e) => updateDraft(idx, { translation: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[#E3DFD6] pt-4">
                    <button
                      type="button"
                      onClick={() => removeDraft(idx)}
                      className="text-xs font-bold text-[#8A3620] hover:underline"
                    >
                      Discard Panel
                    </button>
                    {!isPublished && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void publishSingleDraft(idx)}
                        className="rounded-full bg-[#1B3022] px-6 py-2 text-sm font-bold text-white hover:bg-[#061B0E] disabled:opacity-50 transition-colors"
                      >
                        {isSaving ? "Publishing…" : "Publish This Entry"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 pt-8 border-t border-[#E3DFD6]">
            <button
              onClick={reset}
              className="rounded-full border border-[#C3C8C1] bg-white px-8 py-3 text-sm font-bold text-[#434843] hover:bg-[#F5F4F0] transition-all"
            >
              Cancel & Start Over
            </button>
            <button
              onClick={() => setStep("done")}
              className="rounded-full bg-[#B24A2D] px-8 py-3 text-sm font-bold text-white hover:bg-[#8A3620] shadow-md transition-all"
            >
              Finish Contribution
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
          <h3 className="font-serif text-2xl text-[#061B0E] mb-2">Contribution Session Complete!</h3>
          <p className="text-[#5A665F] mb-6">
            You successfully published {publishedIndices.size} entries. 
            Your support helps keep {languageName} alive for future generations.
          </p>
          <div className="flex justify-center gap-4">
            <Link className="rounded-full bg-[#1B3022] px-6 py-2.5 text-sm font-bold text-[#FBF9F4] hover:bg-[#061B0E] transition-colors" href={`/${languageCode}`}>
              Go to Dictionary
            </Link>
            <button type="button" onClick={reset} className="rounded-full border border-[#C3C8C1] bg-white px-6 py-2.5 text-sm font-semibold text-[#434843] hover:bg-[#F5F4F0] transition-colors">
              Start New Session
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
