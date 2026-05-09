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
    let rawAudioUrl: string;
    try {
      rawAudioUrl = await uploadAudio(rawKey, rawBuffer, audio.type || "audio/webm");
    } catch {
      return NextResponse.json({ error: "Audio upload failed. Please try again." }, { status: 502 });
    }

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

    return NextResponse.json({
      transcript: whisperResult.transcript,
      language_code: whisperResult.language_code || languageCode,
      raw_audio_url: rawAudioUrl,
    });
  } catch {
    return NextResponse.json({ error: "Transcription server unavailable." }, { status: 503 });
  }
}
