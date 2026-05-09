"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ExtractedEntry, Language } from "@/lib/types";

export default function UploadFlow() {
  const [step, setStep] = useState(0);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageCode, setLanguageCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [entries, setEntries] = useState<ExtractedEntry[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/languages");
      if (res.ok) {
        const data = (await res.json()) as Language[];
        setLanguages(data);
        if (data[0]) setLanguageCode(data[0].code);
      }
    })();
  }, []);

  const selectedLanguage = useMemo(
    () => languages.find((l) => l.code === languageCode),
    [languageCode, languages]
  );

  const runPipeline = async () => {
    if (!file || !selectedLanguage) return;

    setStep(1);
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("language_code", selectedLanguage.code);
    const transcribeRes = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });
    const transcribeJson = (await transcribeRes.json()) as { transcript: string };
    setTranscript(transcribeJson.transcript);

    setStep(2);
    const extractRes = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: transcribeJson.transcript,
        language_name: selectedLanguage.name,
        language_code: selectedLanguage.code,
      }),
    });
    const extractJson = (await extractRes.json()) as { entries: ExtractedEntry[] };
    setEntries(extractJson.entries || []);
    setStep(3);
  };

  const saveAll = async () => {
    if (!selectedLanguage) return;
    setStep(4);
    for (const entry of entries) {
      await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...entry,
          language_code: selectedLanguage.code,
          source: "archive",
        }),
      });
    }
    setStep(5);
  };

  return (
    <div className="space-y-3">
      <div className="panel">Step: {step + 1} / 6</div>
      {step === 0 ? (
        <div className="panel space-y-3">
          <select
            className="w-full rounded bg-slate-950 p-2"
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value)}
          >
            {languages.map((language) => (
              <option key={language._id} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
          <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button type="button" onClick={() => void runPipeline()} className="rounded bg-cyan-700 px-3 py-2">
            Upload and Process
          </button>
        </div>
      ) : null}
      {step === 1 ? <div className="panel">Transcribing with Whisper...</div> : null}
      {step === 2 ? <div className="panel">IBM watsonx is reading the language...</div> : null}
      {step === 3 ? (
        <div className="panel space-y-2">
          <p className="text-sm text-slate-400">Transcript:</p>
          <p className="text-sm">{transcript}</p>
          <p className="mt-2">Review extracted entries:</p>
          {entries.map((entry, i) => (
            <div key={`${entry.word}-${i}`} className="rounded border border-slate-700 p-2">
              <input
                className="w-full bg-transparent text-lg font-semibold"
                value={entry.word}
                onChange={(e) => {
                  setEntries((prev) => prev.map((item, idx) => (idx === i ? { ...item, word: e.target.value } : item)));
                }}
              />
              <input
                className="mt-1 w-full bg-transparent text-sm"
                value={entry.translation}
                onChange={(e) => {
                  setEntries((prev) =>
                    prev.map((item, idx) => (idx === i ? { ...item, translation: e.target.value } : item))
                  );
                }}
              />
            </div>
          ))}
          <button type="button" onClick={() => void saveAll()} className="rounded bg-emerald-700 px-3 py-2">
            Save all entries
          </button>
        </div>
      ) : null}
      {step === 4 ? <div className="panel">Saving entries to Cloudant...</div> : null}
      {step === 5 && selectedLanguage ? (
        <div className="panel">
          <p>Upload flow complete.</p>
          <Link className="text-cyan-300 underline" href={`/${selectedLanguage.code}`}>
            Open dictionary
          </Link>
        </div>
      ) : null}
    </div>
  );
}
