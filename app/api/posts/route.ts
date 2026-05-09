import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, saveDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
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
    const body = (await req.json()) as Record<string, unknown>;
    const languageCode = typeof body.language_code === "string" ? body.language_code.trim() : "";
    const text = typeof body.body === "string" ? body.body.trim() : "";
    const parentPostId = typeof body.parent_post_id === "string" ? body.parent_post_id.trim() : "";
    const replyToAuthor = typeof body.reply_to_author === "string" ? body.reply_to_author.trim() : "";
    if (!languageCode || !text) {
      return NextResponse.json({ error: "language_code and body are required" }, { status: 400 });
    }

    const viewer = await requireSession();
    const payload: Post = {
      _id: randomUUID(),
      type: "post",
      language_code: languageCode,
      author_id: viewer.userId,
      author_name: typeof body.author_name === "string" ? body.author_name.trim() || viewer.name : viewer.name || "Anonymous",
      body: text,
      audio_url: typeof body.audio_url === "string" ? body.audio_url : null,
      parent_post_id: parentPostId || null,
      reply_to_author: replyToAuthor || null,
      reactions: {},
      reaction_users: {},
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    };

    const saved = await saveDocument("posts", payload as unknown as Record<string, unknown>);
    return NextResponse.json({ ok: true, saved });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post" },
      { status: 500 }
    );
  }
}
