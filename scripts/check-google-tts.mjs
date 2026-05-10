#!/usr/bin/env node
/**
 * Verifies Google Cloud Text-to-Speech credentials from `.env.local` with a minimal IPA synth.
 * Usage: npm run check:google-tts
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) {
    console.error("Missing .env.local — create one from .env.local.example");
    process.exit(1);
  }
  const map = {};
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map[key] = val;
  }
  return map;
}

async function main() {
  console.log("LangLegacy · Google Cloud TTS check\n");
  const env = loadEnvLocal();
  const apiKey =
    env.GOOGLE_CLOUD_TTS_API_KEY?.trim() || env.GOOGLE_TTS_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "No GOOGLE_CLOUD_TTS_API_KEY (or GOOGLE_TTS_API_KEY) in .env.local"
    );
    process.exit(1);
  }
  console.log("✓ Found API key in .env.local (value not printed)\n");

  const ssml = `<speak><phoneme alphabet="ipa" ph="hˈɛlo">hello</phoneme></speak>`;
  const voiceLanguageCode =
    env.GOOGLE_TTS_VOICE_LANGUAGE?.trim() || "en-US";
  const voiceName = env.GOOGLE_TTS_VOICE_NAME?.trim() || "en-US-Neural2-D";

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;
  console.log(`Calling Google text:synthesize (voice ${voiceName})…`);

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { ssml },
        voice: { languageCode: voiceLanguageCode, name: voiceName },
        audioConfig: { audioEncoding: "MP3" },
      }),
    });
  } catch (e) {
    console.error("Fetch failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("\n✗ Google API error:", res.status);
    console.error(JSON.stringify(payload, null, 2));
    console.error("\nHints: Enable Cloud Text-to-Speech API + link billing if required.");
    process.exit(1);
  }

  if (!payload.audioContent) {
    console.error("\n✗ No audioContent in response");
    console.error(payload);
    process.exit(1);
  }

  const bytes = Buffer.from(payload.audioContent, "base64").length;
  console.log(`✓ Synthetic OK · returned ~${bytes} bytes of MP3\n`);

  console.log("Next steps:");
  console.log("  1. npm run dev");
  console.log(
    "  2. Browser: http://localhost:3000/api/tts/ipa  →  { \"ipa_tts_configured\": true }"
  );
  console.log(
    "  3. Dictionary → entry with IPA in phonetic → Pronounce (uses IPA SSML)\n"
  );
}

main();
