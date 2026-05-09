import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, saveDocument } from "@/lib/cloudant";
import { getViewerIdentityFromHeaders } from "@/lib/auth";
import type { Post } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const languageCode = req.nextUrl.searchParams.get("language_code");
    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }
    const docs = (await findDocuments(
      "posts",
      { type: "post", language_code: languageCode, status: "active" },
      200,
      0
    )) as Post[];
    docs.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, string | null>;
    const languageCode = (body.language_code || "").trim();
    const text = (body.body || "").trim();
    if (!languageCode || !text) {
      return NextResponse.json({ error: "language_code and body are required" }, { status: 400 });
    }

    const viewer = getViewerIdentityFromHeaders(req.headers);
    const payload: Post = {
      _id: randomUUID(),
      type: "post",
      language_code: languageCode,
      author_id: viewer.userId,
      author_name: (body.author_name || viewer.name || "Anonymous").toString(),
      body: text,
      audio_url: body.audio_url || null,
      reactions: {},
      reaction_users: {},
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    };

    const saved = await saveDocument("posts", payload as unknown as Record<string, unknown>);
    return NextResponse.json({ ok: true, saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post" },
      { status: 500 }
    );
  }
}
