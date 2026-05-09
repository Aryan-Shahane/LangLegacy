import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { uploadAudio } from "@/lib/cos";
import { transcribeAudio } from "@/lib/whisper";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio");
    const languageCode = String(formData.get("language_code") || "");

    if (!(audio instanceof File) || !languageCode) {
      return NextResponse.json({ error: "audio and language_code required" }, { status: 400 });
    }

    const ext = audio.type.includes("webm") ? "webm" : "wav";
    const rawKey = `raw/${randomUUID()}.${ext}`;
    const rawBuffer = Buffer.from(await audio.arrayBuffer());
    const rawAudioUrl = await uploadAudio(rawKey, rawBuffer, audio.type || "audio/webm");
    const whisperResult = await transcribeAudio(audio, languageCode);

    return NextResponse.json({
      transcript: whisperResult.transcript,
      language_code: whisperResult.language_code || languageCode,
      raw_audio_url: rawAudioUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
