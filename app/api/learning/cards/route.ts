import { NextRequest, NextResponse } from "next/server";
import { coerceEntry } from "@/lib/entryCoercion";
import { entryHasMeaningfulTranslation } from "@/lib/entryTranslation";
import { findDocuments } from "@/lib/cloudant";
import type { Entry } from "@/lib/types";

function shuffle<T>(arr: T[]) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const languageCode = req.nextUrl.searchParams.get("language_code");
    const n = Number(req.nextUrl.searchParams.get("n") || 10);
    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }

    const selector = {
      $and: [
        { type: "entry" },
        { language_code: languageCode },
        { $or: [{ status: { $exists: false } }, { status: "active" }, { status: "under_review" }] },
      ],
    };

    const raw = (await findDocuments("entries", selector, 300, 0)) as Record<string, unknown>[];
    const usable = raw
      .map(coerceEntry)
      .filter((e: Entry) => entryHasMeaningfulTranslation(e) && e.word.trim().length > 0);
    const picked = shuffle(usable).slice(0, Math.max(1, Math.min(n, 30)));
    return NextResponse.json(picked);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load learning cards" },
      { status: 500 }
    );
  }
}
