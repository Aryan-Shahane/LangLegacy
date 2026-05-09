"use client";

import { useRef, useState } from "react";

export default function AudioRecorder({
  onRecordingComplete,
}: {
  onRecordingComplete: (blob: Blob) => void;
}) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onRecordingComplete(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    recorder.start();
    setRecording(true);
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="panel">
      <button
        type="button"
        onClick={recording ? stop : () => void start()}
        className="rounded bg-rose-700 px-3 py-2 hover:bg-rose-600"
      >
        {recording ? "Stop recording" : "Start recording"}
      </button>
    </div>
  );
}
