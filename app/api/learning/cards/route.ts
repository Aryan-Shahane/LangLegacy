import { NextRequest, NextResponse } from "next/server";
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

    const docs = (await findDocuments("entries", {
      type: "entry",
      language_code: languageCode,
    }, 300, 0)) as Entry[];
    const picked = shuffle(docs).slice(0, Math.max(1, Math.min(n, 30)));
    return NextResponse.json(picked);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load learning cards" },
      { status: 500 }
    );
  }
}
