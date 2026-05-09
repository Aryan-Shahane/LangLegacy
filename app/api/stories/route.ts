import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, saveDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
import { glossaryTranslationForLanguage } from "@/lib/dictionaryTranslate";
import type { Story } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const languageCode = req.nextUrl.searchParams.get("language_code");
    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }
    const docs = (await findDocuments(
      "stories",
      { type: "story", language_code: languageCode },
      200,
      0
    )) as Story[];
    docs.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const language_code = typeof body.language_code === "string" ? body.language_code.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
    const duration_seconds =
      typeof body.duration_seconds === "number"
        ? body.duration_seconds
        : Number(body.duration_seconds) || 0;
    const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [];
    const audio_url_raw = typeof body.audio_url === "string" ? body.audio_url.trim() : "";
    if (!language_code || !title || !description || !audio_url_raw) {
      return NextResponse.json(
        { error: "language_code, title, description, and audio_url (recording) are required" },
        { status: 400 }
      );
    }
    const transcript_translation = await glossaryTranslationForLanguage(language_code, transcript);
    const viewer = await requireSession();
    const story: Story = {
      _id: randomUUID(),
      type: "story",
      language_code,
      title,
      author_name:
        typeof body.author_name === "string" ? body.author_name.trim() || viewer.name : viewer.name || "Anonymous",
      author_id: viewer.userId,
      description,
      audio_url: audio_url_raw,
      transcript,
      transcript_translation,
      duration_seconds,
      tags,
      reactions: {},
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    };
    const saved = await saveDocument("stories", story as unknown as Record<string, unknown>);
    return NextResponse.json({ ok: true, saved });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 }
    );
  }
}
