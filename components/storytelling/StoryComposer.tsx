"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

async function inferDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
      };
      const done = (n: number) => {
        finish();
        resolve(n);
      };
      const timeout = window.setTimeout(() => done(1), 10000);
      audio.addEventListener(
        "loadedmetadata",
        () => {
          window.clearTimeout(timeout);
          const d = Number.isFinite(audio.duration) ? Math.max(1, Math.round(audio.duration)) : 1;
          done(d);
        },
        { once: true }
      );
      audio.addEventListener(
        "error",
        () => {
          window.clearTimeout(timeout);
          done(1);
        },
        { once: true }
      );
    } catch {
      resolve(1);
    }
  });
}

export default function StoryComposer({
  languageCode,
  onCreated,
}: {
  languageCode: string;
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(1);
  const [audioFileLabel, setAudioFileLabel] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordElapsedSec, setRecordElapsedSec] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordIntervalRef = useRef<number | null>(null);
  const recordStartedAtRef = useRef<number>(0);
  const discardRecordingRef = useRef(false);

  const processAudioFile = useCallback(
    async (file: File, label: string) => {
      setError(null);
      setAudioFileLabel(label);
      setTranscribing(true);
      setAudioUrl(null);
      setTranscript("");
      try {
        const dur = await inferDurationSeconds(file);
        setDurationSeconds(dur);
      } catch {
        setDurationSeconds(1);
      }
      try {
        const fd = new FormData();
        fd.set("audio", file);
        fd.set("language_code", languageCode);
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          transcript?: string;
          raw_audio_url?: string;
        };
        if (!res.ok) throw new Error(data.error || "Transcription failed.");
        setTranscript((data.transcript || "").trim());
        setAudioUrl(typeof data.raw_audio_url === "string" ? data.raw_audio_url.trim() || null : null);
        if (!data.raw_audio_url) throw new Error("Upload did not return an audio URL.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Transcription failed.");
        setAudioFileLabel(null);
      } finally {
        setTranscribing(false);
      }
    },
    [languageCode]
  );

  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) window.clearInterval(recordIntervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== "inactive") {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const stopRecordTimer = () => {
    if (recordIntervalRef.current) {
      window.clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
  };

  const startRecording = async () => {
    if (transcribing || busy || isRecording) return;
    setError(null);
    discardRecordingRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = candidates.find((t) => MediaRecorder.isTypeSupported(t)) || "";
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
        stopRecordTimer();

        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          return;
        }

        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const ext = blob.type.includes("webm") ? "webm" : "m4a";
        const file = new File([blob], `recording.${ext}`, { type: blob.type || "audio/webm" });
        void processAudioFile(file, "Recorded in browser");
      };

      mediaRecorderRef.current = rec;
      rec.start(250);
      setIsRecording(true);
      recordStartedAtRef.current = Date.now();
      setRecordElapsedSec(0);
      recordIntervalRef.current = window.setInterval(() => {
        setRecordElapsedSec(Math.floor((Date.now() - recordStartedAtRef.current) / 1000));
      }, 300);
    } catch {
      setError("Could not access the microphone. Check browser permissions.");
    }
  };

  const stopRecording = () => {
    discardRecordingRef.current = false;
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  };

  const cancelRecording = () => {
    discardRecordingRef.current = true;
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsRecording(false);
      stopRecordTimer();
      discardRecordingRef.current = false;
    }
  };

  const onFileChosen = async (file: File | null) => {
    if (!file) {
      setAudioUrl(null);
      setTranscript("");
      setAudioFileLabel(null);
      return;
    }
    await processAudioFile(file, file.name);
  };

  const submit = async () => {
    if (!audioUrl) {
      setError("Add a recording and wait for transcription to finish.");
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
          description: description.trim(),
          transcript,
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
      setAudioUrl(null);
      setTranscript("");
      setAudioFileLabel(null);
      setDurationSeconds(1);
      await onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Card className="space-y-3 bg-[#F5F3EE] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[#737973]">Add a storytelling recording</p>
      <p className="text-[11px] leading-relaxed text-[#757C76]">
        Record in your browser here, or upload a file. Audio is transcribed with Whisper and the English panel comes from your
        archive dictionary.
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

      {audioFileLabel ? (
        <p className="text-[11px] text-[#757C76]">
          {transcribing ? "Transcribing…" : audioUrl ? `${audioFileLabel} · ~${durationSeconds}s` : "Processing failed — try again"}
        </p>
      ) : null}

      {transcript !== "" ? (
        <div className="rounded-lg border border-[#C3C8C1]/35 bg-[#FBF9F4] p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#757C76]">Transcript (auto)</p>
          <p className="mt-1 whitespace-pre-wrap font-serif text-sm leading-relaxed text-[#1B1C19]">{transcript}</p>
        </div>
      ) : null}

      <Input placeholder="Tags, comma-separated" value={tags} onChange={(e) => setTags(e.target.value)} className="bg-[#FBF9F4]" />

      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
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
