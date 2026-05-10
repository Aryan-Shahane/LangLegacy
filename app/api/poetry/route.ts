import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, saveDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
import { translateTextWithAI } from "@/lib/featherless";
import { languageIsArchiveMode } from "@/lib/languageArchive";
import { mockPoemsForLanguage } from "@/lib/mock/poetryStoriesMockData";
import type { Poem } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const languageCode = req.nextUrl.searchParams.get("language_code");
    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }
    let docs: Poem[] = [];
    try {
      docs = (await findDocuments(
        "poetry",
        { type: "poem", language_code: languageCode },
        200,
        0
      )) as Poem[];
    } catch (dbError) {
      console.warn("Poetry Cloudant query failed; using mock catalog only.", dbError);
    }
    const active = docs.filter((d) => d.status !== "removed");
    if (active.length === 0) {
      return NextResponse.json(mockPoemsForLanguage(languageCode));
    }
    active.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json(active);
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
    const language_code =
      typeof body.language_code === "string" ? body.language_code.trim().toLowerCase() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const body_original = typeof body.body_original === "string" ? body.body_original.trim() : "";
    if (!language_code || !title || !body_original) {
      return NextResponse.json(
        { error: "language_code, title, and body_original are required" },
        { status: 400 }
      );
    }
    const archive = await languageIsArchiveMode(language_code);
    let body_translation = "";
    if (!archive) {
      try {
        body_translation = await translateTextWithAI(body_original, language_code);
      } catch (e) {
        console.error("AI translation failed, fallback to empty", e);
      }
    }
    const viewer = await requireSession();
    const poem: Poem = {
      _id: randomUUID(),
      type: "poem",
      language_code,
      title,
      author_name:
        typeof body.author_name === "string" ? body.author_name.trim() || viewer.name : viewer.name || "Anonymous",
      author_id: viewer.userId,
      body_original,
      body_translation,
      audio_url: typeof body.audio_url === "string" ? body.audio_url : null,
      reactions: {},
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    };

    const saved = await saveDocument("poetry", poem as unknown as Record<string, unknown>);
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
