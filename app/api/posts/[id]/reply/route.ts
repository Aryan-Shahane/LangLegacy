import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDocument, saveDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
import { normalizeForumPost } from "@/lib/forumCoerce";
import type { Post } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parentId } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const languageCode = typeof body.language_code === "string" ? body.language_code.trim() : "";
    const text = typeof body.body === "string" ? body.body.trim() : "";
    const replyToAuthor =
      typeof body.reply_to_author === "string" ? body.reply_to_author.trim() : "";

    if (!languageCode || !text) {
      return NextResponse.json({ error: "language_code and body are required" }, { status: 400 });
    }

    const parentRaw = await getDocument("posts", parentId);
    if (!parentRaw) {
      return NextResponse.json({ error: "Parent post not found" }, { status: 404 });
    }
    const parent = normalizeForumPost(parentRaw);

    const pd = typeof parent.depth === "number" ? parent.depth : parent.parent_id || parent.parent_post_id ? 1 : 0;
    const depth = Math.min(pd + 1, 2);
    const root_id = pd === 0 ? parent._id : parent.root_id || parent._id;

    const viewer = await requireSession();
    const payload: Post = {
      _id: randomUUID(),
      type: "post",
      section: "forum",
      language_code: languageCode,
      author_id: viewer.userId,
      author_name:
        typeof body.author_name === "string" ? body.author_name.trim() || viewer.name : viewer.name || "Anonymous",
      body: text,
      audio_url: typeof body.audio_url === "string" ? body.audio_url : null,
      parent_id: parentId,
      root_id,
      depth,
      parent_post_id: parentId,
      reply_to_author: replyToAuthor || parent.author_name || null,
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
      { error: error instanceof Error ? error.message : "Failed to reply" },
      { status: 500 }
    );
  }
}
