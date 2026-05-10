import type { Entry } from "@/lib/types";

function playMp3Blob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    const cleanup = () => URL.revokeObjectURL(url);

    audio.addEventListener(
      "ended",
      () => {
        cleanup();
        resolve();
      },
      { once: true }
    );
    audio.addEventListener(
      "error",
      () => {
        cleanup();
        reject(new Error("Audio playback failed."));
      },
      { once: true }
    );

    void audio.play().catch((err) => {
      cleanup();
      reject(err instanceof Error ? err : new Error("Playback failed."));
    });
  });
}

function playSpeechFallback(textToSpeak: string, lang: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.lang = lang;
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("Speech synthesis failed."));
    window.speechSynthesis.speak(utter);
  });
}

/**
 * Play pronunciation: Google Cloud TTS with IPA SSML when `phonetic` is set and `/api/tts/ipa` works;
 * otherwise browser SpeechSynthesis (legacy behavior).
 * Resolves when playback finishes or rejects on hard failure after fallback attempt.
 */
export async function playEntryPronunciation(
  entry: Pick<Entry, "phonetic" | "word" | "language_code">
): Promise<void> {
  const phonetic = entry.phonetic?.trim();
  const textToSpeak = phonetic || entry.word;
  const lang = phonetic ? "en" : entry.language_code;

  if (phonetic && typeof window !== "undefined") {
    try {
      const res = await fetch("/api/tts/ipa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phonetic,
          word: entry.word,
          language_code: entry.language_code,
        }),
      });
      const ct = res.headers.get("content-type") || "";
      if (res.ok && (ct.includes("audio") || ct.includes("mpeg"))) {
        const blob = await res.blob();
        if (blob.size > 0) {
          await playMp3Blob(blob);
          return;
        }
      }
    } catch {
      /* fall through */
    }
  }

  await playSpeechFallback(textToSpeak, lang);
}
