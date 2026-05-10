"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { postTranscribeWithProgress } from "@/components/community/transcribeWithProgress";

export type TranscribeApiResponse = {
  transcript?: string;
  raw_audio_url?: string;
  audio_only?: boolean;
  audio_only_reason?: string;
  error?: string;
};

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

/**
 * Browser record/upload → POST /api/transcribe (same pipeline as Dictionary upload + Community recording).
 */
export function useAudioTranscription(languageCode: string) {
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [transcribePhaseLabel, setTranscribePhaseLabel] = useState("");
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(1);
  const [audioFileLabel, setAudioFileLabel] = useState<string | null>(null);
  const [audioOnlyInfo, setAudioOnlyInfo] = useState<string | null>(null);
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
      setAudioOnlyInfo(null);
      setAudioFileLabel(label);
      setTranscribing(true);
      setTranscribeProgress(0);
      setTranscribePhaseLabel("");
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
        const { ok, body } = await postTranscribeWithProgress(fd, (pct, label) => {
          setTranscribeProgress(pct);
          setTranscribePhaseLabel(label);
        });
        const data = body as TranscribeApiResponse;
        if (!ok) throw new Error(typeof data.error === "string" ? data.error : "Transcription failed.");
        const url = typeof data.raw_audio_url === "string" ? data.raw_audio_url.trim() : "";
        if (!url) throw new Error("Upload did not return an audio URL.");
        setAudioUrl(url);
        setTranscript((data.transcript || "").trim());
        if (data.audio_only) {
          setAudioOnlyInfo(
            data.audio_only_reason ||
              "Automatic transcription is not available for this language code. Your audio is saved — type the transcript below."
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Transcription failed.");
        setAudioFileLabel(null);
        setAudioUrl(null);
      } finally {
        setTranscribing(false);
        setTranscribeProgress(0);
        setTranscribePhaseLabel("");
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
    if (transcribing || isRecording) return;
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

  const resetAudio = useCallback(() => {
    setAudioUrl(null);
    setTranscript("");
    setAudioFileLabel(null);
    setAudioOnlyInfo(null);
    setDurationSeconds(1);
  }, []);

  return {
    transcribing,
    transcribeProgress,
    transcribePhaseLabel,
    transcript,
    setTranscript,
    audioUrl,
    setAudioUrl,
    durationSeconds,
    audioFileLabel,
    audioOnlyInfo,
    error,
    setError,
    isRecording,
    recordElapsedSec,
    processAudioFile,
    startRecording,
    stopRecording,
    cancelRecording,
    resetAudio,
  };
}
