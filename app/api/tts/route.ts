import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const text = req.nextUrl.searchParams.get("text");
    if (!text) {
      return NextResponse.json({ error: "Missing 'text' parameter" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server is missing ElevenLabs API key" }, { status: 500 });
    }

    // Default to a versatile, clear voice (e.g., 'Rachel')
    const voiceId = "21m00Tcm4TlvDq8ikWAM"; 

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      console.error("ElevenLabs API Error:", res.status, errText);
      let errorMessage = "Failed to fetch audio from ElevenLabs";
      try {
        const errJson = JSON.parse(errText);
        errorMessage = errJson?.detail?.message || errorMessage;
      } catch (e) {
        // Not JSON
      }
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("TTS Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal TTS Proxy error" },
      { status: 500 }
    );
  }
}
