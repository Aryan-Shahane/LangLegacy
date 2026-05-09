import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { uploadAudio } from "@/lib/cos";
import { transcribeAudio, isWhisperSupported } from "@/lib/whisper";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio");
    const languageCode = String(formData.get("language_code") || "");

    if (!(audio instanceof File) || !languageCode) {
      return NextResponse.json({ error: "audio and language_code required" }, { status: 400 });
    }

    // Upload the raw audio regardless
    let ext = "wav";
    if (audio.type.includes("webm")) ext = "webm";
    if (audio.type.includes("mp4")) ext = "mp4";
    const rawKey = `raw/${randomUUID()}.${ext}`;
    const rawBuffer = Buffer.from(await audio.arrayBuffer());
    let rawAudioUrl: string;
    try {
      rawAudioUrl = await uploadAudio(rawKey, rawBuffer, audio.type || "audio/webm");
    } catch {
      return NextResponse.json({ error: "Audio upload failed. Please try again." }, { status: 502 });
    }

    // Check if Whisper supports this language
    if (!isWhisperSupported(languageCode)) {
      // Language not supported by Whisper — return audio-only response
      return NextResponse.json({
        transcript: "",
        language_code: languageCode,
        raw_audio_url: rawAudioUrl,
        audio_only: true,
        audio_only_reason: `Whisper does not support "${languageCode}". Your audio has been saved. Please fill in the word, translation, and definition manually.`,
      });
    }

    // Language IS supported — attempt transcription
    let whisperResult: { transcript: string; language_code: string };
    try {
      whisperResult = await transcribeAudio(audio, languageCode);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      const body =
        /upload|Cloudinary/i.test(msg) ? "Audio upload failed. Please try again." : "Transcription server unavailable.";
      const status = /upload|Cloudinary/i.test(msg) ? 502 : 503;
      return NextResponse.json({ error: body }, { status });
    }

    // Save transcript to a local file for the user
    try {
      const outputPath = path.join(process.cwd(), "whisper_output.txt");
      fs.writeFileSync(outputPath, `Transcript (${languageCode}):\n\n${whisperResult.transcript}\n\n`);
    } catch (err) {
      console.error("Failed to write whisper output to file:", err);
    }

    return NextResponse.json({
      transcript: whisperResult.transcript,
      language_code: whisperResult.language_code || languageCode,
      raw_audio_url: rawAudioUrl,
      audio_only: false,
    });
  } catch {
    return NextResponse.json({ error: "Transcription server unavailable." }, { status: 503 });
  }
}
