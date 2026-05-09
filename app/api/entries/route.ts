import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, getDocument, putDocument, saveDocument } from "@/lib/cloudant";
import { uploadAudio } from "@/lib/cos";
import type { Entry } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const languageCode = req.nextUrl.searchParams.get("language_code");
    const q = req.nextUrl.searchParams.get("q") || "";
    const limit = Number(req.nextUrl.searchParams.get("limit") || 20);
    const offset = Number(req.nextUrl.searchParams.get("offset") || 0);

    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }

    const selector: Record<string, unknown> = {
      type: "entry",
      language_code: languageCode,
    };
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      selector.$and = [
        { type: "entry" },
        { language_code: languageCode },
        { $or: [{ word: { $regex: `(?i)${escaped}` } }, { translation: { $regex: `(?i)${escaped}` } }] },
      ];
      delete selector.type;
      delete selector.language_code;
    }

    const docs = (await findDocuments("entries", selector, limit, offset)) as Entry[];
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, string | null>;
    const id = randomUUID();
    let audioUrl: string | null = null;

    if (body.audio_base64 && body.audio_type) {
      const key = `entries/${id}.webm`;
      const buffer = Buffer.from(body.audio_base64, "base64");
      audioUrl = await uploadAudio(key, buffer, body.audio_type);
    }

    const payload: Entry = {
      _id: id,
      type: "entry",
      language_code: body.language_code || "",
      word: body.word || "",
      phonetic: body.phonetic || null,
      translation: body.translation || "",
      part_of_speech: body.part_of_speech || null,
      example_sentence: body.example_sentence || null,
      example_translation: body.example_translation || null,
      audio_url: audioUrl || body.audio_url || null,
      source: body.source === "community" ? "community" : "archive",
      created_at: new Date().toISOString(),
    };

    const saved = await saveDocument("entries", payload as unknown as Record<string, unknown>);

    // Keep language card counts fresh for the home page.
    if (payload.language_code) {
      const languageDoc = await getDocument("languages", payload.language_code);
      if (languageDoc && typeof languageDoc._rev === "string") {
        const currentCount =
          typeof languageDoc.entry_count === "number" ? languageDoc.entry_count : 0;
        await putDocument("languages", payload.language_code, {
          ...languageDoc,
          entry_count: currentCount + 1,
        });
      }
    }

    return NextResponse.json({ ok: true, saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save entry" },
      { status: 500 }
    );
  }
}
