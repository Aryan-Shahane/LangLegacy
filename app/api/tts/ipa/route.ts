import { NextRequest, NextResponse } from "next/server";
import { hasGoogleCloudTtsConfigured, synthesizeIpaToMp3 } from "@/lib/googleTts";

/** Whether server env includes a Google TTS API key (value not exposed). */
export async function GET() {
  return NextResponse.json({
    ipa_tts_configured: hasGoogleCloudTtsConfigured(),
  });
}

/**
 * POST JSON: { phonetic: string, word?: string, language_code?: string }
 * Returns audio/mpeg when Google TTS is configured and synthesis succeeds.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const phonetic = typeof body.phonetic === "string" ? body.phonetic.trim() : "";
    if (!phonetic) {
      return NextResponse.json({ error: "phonetic is required" }, { status: 400 });
    }
    const word = typeof body.word === "string" ? body.word.trim() : "";

    const result = await synthesizeIpaToMp3({
      phonetic,
      surfaceWord: word,
    });

    if (!result.ok) {
      const status =
        result.status === 403 || result.status === 401 ? 503 : result.status && result.status >= 400 ? 502 : 503;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return new NextResponse(new Uint8Array(result.mp3), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "TTS failed" },
      { status: 500 }
    );
  }
}
