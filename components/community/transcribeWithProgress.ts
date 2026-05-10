"use client";

export type TranscribeProgressHandler = (percent: number, phaseLabel: string) => void;

export type TranscribeXhrResult = {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
};

/**
 * POST `/api/transcribe` with real upload progress (XHR) and estimated progress while the server runs Whisper.
 */
export function postTranscribeWithProgress(
  formData: FormData,
  onProgress: TranscribeProgressHandler
): Promise<TranscribeXhrResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/transcribe");
    xhr.responseType = "text";

    let waitInterval: number | null = null;
    const clearWait = () => {
      if (waitInterval !== null) {
        window.clearInterval(waitInterval);
        waitInterval = null;
      }
    };

    let waitProgress = 0;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && e.total > 0) {
        const pct = Math.min(36, Math.round((e.loaded / e.total) * 36));
        onProgress(Math.max(1, pct), "Uploading audio…");
        waitProgress = pct;
      } else {
        onProgress(6, "Uploading audio…");
        waitProgress = 6;
      }
    });

    xhr.upload.addEventListener("load", () => {
      onProgress(38, "Transcribing speech…");
      waitProgress = 38;
      waitInterval = window.setInterval(() => {
        waitProgress = Math.min(waitProgress + 0.85 + Math.random(), 94);
        onProgress(Math.round(waitProgress), "Transcribing speech…");
      }, 380);
    });

    xhr.onload = () => {
      clearWait();
      let body: Record<string, unknown> = {};
      try {
        body = xhr.responseText ? (JSON.parse(xhr.responseText) as Record<string, unknown>) : {};
      } catch {
        body = { error: "Invalid response from transcription server." };
      }
      onProgress(100, "Done");
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
    };

    xhr.onerror = () => {
      clearWait();
      onProgress(0, "");
      reject(new Error("Network error while contacting the transcription server."));
    };

    xhr.onabort = () => {
      clearWait();
      onProgress(0, "");
      reject(new Error("Transcription was cancelled."));
    };

    xhr.send(formData);
  });
}
