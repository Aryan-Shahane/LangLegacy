/**
 * Google Cloud Text-to-Speech REST synthesis (Node/server only).
 * IPA is passed with SSML {@link https://cloud.google.com/text-to-speech/docs/ssml}
 */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** SSML using IPA phoneme — surface text is what users see; `ph` drives pronunciation. */
export function ipaToSsml(phonetic: string, surfaceWord: string): string {
  const ph = escapeXml(phonetic.trim());
  const surface = escapeXml((surfaceWord || "·").trim() || "·");
  return `<speak><phoneme alphabet="ipa" ph="${ph}">${surface}</phoneme></speak>`;
}

export type GoogleTtsSynthesizeResult =
  | { ok: true; mp3: Buffer }
  | { ok: false; error: string; status?: number };

/**
 * Calls `text:synthesize` with API key auth.
 * Set `GOOGLE_CLOUD_TTS_API_KEY` (or `GOOGLE_TTS_API_KEY`) in the server environment.
 */
export function hasGoogleCloudTtsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLOUD_TTS_API_KEY?.trim() || process.env.GOOGLE_TTS_API_KEY?.trim()
  );
}

export async function synthesizeIpaToMp3(params: {
  phonetic: string;
  surfaceWord: string;
  /** BCP-47 voice locale, e.g. en-US */
  voiceLanguageCode?: string;
  /** e.g. en-US-Neural2-D */
  voiceName?: string;
}): Promise<GoogleTtsSynthesizeResult> {
  const apiKey =
    process.env.GOOGLE_CLOUD_TTS_API_KEY?.trim() || process.env.GOOGLE_TTS_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Google Cloud TTS is not configured (missing API key)." };
  }

  const voiceLanguageCode =
    params.voiceLanguageCode?.trim() ||
    process.env.GOOGLE_TTS_VOICE_LANGUAGE?.trim() ||
    "en-US";
  const voiceName =
    params.voiceName?.trim() ||
    process.env.GOOGLE_TTS_VOICE_NAME?.trim() ||
    "en-US-Neural2-D";

  const ssml = ipaToSsml(params.phonetic, params.surfaceWord);
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { ssml },
      voice: { languageCode: voiceLanguageCode, name: voiceName },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return {
      ok: false,
      error: errText || `Google TTS HTTP ${res.status}`,
      status: res.status,
    };
  }

  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) {
    return { ok: false, error: "Google TTS returned no audioContent." };
  }

  return { ok: true, mp3: Buffer.from(data.audioContent, "base64") };
}
