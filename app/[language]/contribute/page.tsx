"use client";

import { useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";

export default function ContributePage({
  params,
}: {
  params: { language: string };
}) {
  const [status, setStatus] = useState("");

  const submit = async (blob: Blob) => {
    setStatus("Submitting...");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    const base64 = btoa(binary);
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_code: params.language,
        word: "community contribution",
        phonetic: null,
        translation: "community contribution",
        part_of_speech: "other",
        example_sentence: null,
        example_translation: null,
        source: "community",
        audio_base64: base64,
        audio_type: "audio/webm",
      }),
    });
    setStatus(res.ok ? "Saved successfully" : "Failed to save");
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Contribute Recording ({params.language})</h1>
      <AudioRecorder onRecordingComplete={(blob) => void submit(blob)} />
      <p className="text-sm text-slate-300">{status}</p>
    </section>
  );
}
