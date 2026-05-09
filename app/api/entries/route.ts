import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, getDocument, putDocument, saveDocument } from "@/lib/cloudant";
import { coerceEntry } from "@/lib/entryCoercion";
import { getSessionFromCookie } from "@/lib/auth";
import { uploadAudio } from "@/lib/cos";

export async function GET(req: NextRequest) {
  try {
    const languageCode = req.nextUrl.searchParams.get("language_code");
    const q = req.nextUrl.searchParams.get("q") || "";
    const limit = Number(req.nextUrl.searchParams.get("limit") || 20);
    const offset = Number(req.nextUrl.searchParams.get("offset") || 0);

    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }

    const baseAnd: Record<string, unknown>[] = [
      { type: "entry" },
      { language_code: languageCode },
      { $or: [{ status: { $exists: false } }, { status: "active" }, { status: "under_review" }] },
    ];

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      baseAnd.push({
        $or: [{ word: { $regex: `(?i)${escaped}` } }, { translation: { $regex: `(?i)${escaped}` } }],
      });
    }

    const selector: Record<string, unknown> = { $and: baseAnd };
    const docs = (await findDocuments("entries", selector, limit, offset)) as Record<
      string,
      unknown
    >[];
    return NextResponse.json(docs.map(coerceEntry));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, string | null | boolean | undefined>;
    const session = await getSessionFromCookie();
    const contributor_id = session?.userId ?? null;
    const contributor_name = session?.name ?? null;

    const wordProbe = String(body.word || "").trim();
    const language_code = String(body.language_code || "");

    if (body.duplicate_probe === true || body.duplicate_probe === "true") {
      if (!language_code || !wordProbe) {
        return NextResponse.json({ error: "language_code and word are required for duplicate probe." }, { status: 400 });
      }
      const dupAnd: Record<string, unknown>[] = [
        { type: "entry" },
        { language_code },
        { $or: [{ status: { $exists: false } }, { status: "active" }, { status: "under_review" }] },
      ];
      const esc = wordProbe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      dupAnd.push({ word: { $regex: `(?i)^${esc}$` } });
      const dupSelector = { $and: dupAnd };
      const matches = (await findDocuments("entries", dupSelector, 8, 0)) as Record<
        string,
        unknown
      >[];
      if (matches.length > 0) {
        return NextResponse.json({
          duplicate_warning: true,
          matches: matches.map(coerceEntry),
          message: "Possible duplicate entry detected.\nWould you like to merge or create a new entry?",
        });
      }
      return NextResponse.json({ duplicate_warning: false });
    }

    const id = randomUUID();
    let audioUrl: string | null = null;

    if (body.audio_base64 && body.audio_type) {
      const key = `entries/${id}.webm`;
      const buffer = Buffer.from(String(body.audio_base64), "base64");
      try {
        audioUrl = await uploadAudio(key, buffer, String(body.audio_type));
      } catch {
        return NextResponse.json({ error: "Audio upload failed. Please try again." }, { status: 502 });
      }
    }

    const word = wordProbe;
    const translation = String(body.translation || "").trim();

    const definition =
      body.definition != null && String(body.definition).trim()
        ? String(body.definition).trim()
        : null;

    const payload: Record<string, unknown> = {
      _id: id,
      type: "entry",
      language_code,
      word: word || "(untitled)",
      translation: translation || "(needs translation)",
      definition,
      phonetic: body.phonetic || null,
      part_of_speech: body.part_of_speech || null,
      example_sentence: body.example_sentence || null,
      example_translation: body.example_translation || null,
      audio_url: audioUrl || body.audio_url || null,
      source: body.source === "community" ? "community" : "archive",
      contributor_id,
      contributor_name:
        contributor_name ??
        (String(body.source || "archive") === "community" ? "Community" : null),
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    };

    const saved = await saveDocument("entries", payload);

    if (language_code) {
      const languageDoc = await getDocument("languages", language_code);
      if (languageDoc && typeof languageDoc._rev === "string") {
        const currentCount =
          typeof languageDoc.entry_count === "number" ? languageDoc.entry_count : 0;
        await putDocument("languages", language_code, {
          ...languageDoc,
          entry_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ ok: true, saved, entry: coerceEntry(payload) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save entry" },
      { status: 500 }
    );
  }
}
