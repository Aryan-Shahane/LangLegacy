import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, getDocument, saveDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
import { normalizeForumPost } from "@/lib/forumCoerce";
import { mockForumPostsForLanguage } from "@/lib/mock/forumMockData";
import type { Post } from "@/lib/types";

function isForumDoc(doc: Record<string, unknown>): boolean {
  const s = doc.section;
  return s === undefined || s === null || s === "" || s === "forum";
}

async function computeThreadFields(
  parentId: string | null,
  existingParent?: Record<string, unknown>
): Promise<{ parent_id: string | null; root_id: string | null; depth: number }> {
  if (!parentId) {
    return { parent_id: null, root_id: null, depth: 0 };
  }
  let parentRaw = existingParent;
  if (!parentRaw) {
    const loaded = await getDocument("posts", parentId);
    parentRaw = loaded ?? undefined;
  }
  if (!parentRaw) {
    throw new Error("Parent post not found");
  }
  const parent = normalizeForumPost(parentRaw);
  const pd = typeof parent.depth === "number" ? parent.depth : parent.parent_id || parent.parent_post_id ? 1 : 0;
  const depth = Math.min(pd + 1, 2);
  const root_id = pd === 0 ? parent._id : parent.root_id || parent._id;
  return { parent_id: parentId, root_id, depth };
}

export async function GET(req: NextRequest) {
  try {
    const languageCode = req.nextUrl.searchParams.get("language_code");
    const section = req.nextUrl.searchParams.get("section") || "forum";
    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }
    if (section !== "forum") {
      return NextResponse.json({ error: "unsupported section" }, { status: 400 });
    }
    let docsRaw: Record<string, unknown>[] = [];
    try {
      docsRaw = (await findDocuments(
        "posts",
        { type: "post", language_code: languageCode, status: "active" },
        500,
        0
      )) as Record<string, unknown>[];
    } catch (dbError) {
      console.warn("Forum posts Cloudant query failed — using bundled demo threads.", dbError);
    }

    let posts = docsRaw
      .filter((d): d is Record<string, unknown> => typeof d === "object" && d !== null && isForumDoc(d as Record<string, unknown>))
      .map((d) => normalizeForumPost(d));
    if (posts.length === 0) {
      posts = mockForumPostsForLanguage(languageCode);
    }
    posts.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json(posts);
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
    const parentFromBody =
      (typeof body.parent_id === "string" ? body.parent_id.trim() : "") ||
      (typeof body.parent_post_id === "string" ? body.parent_post_id.trim() : "") ||
      "";
    const replyToAuthor = typeof body.reply_to_author === "string" ? body.reply_to_author.trim() : "";
    if (!languageCode || !text) {
      return NextResponse.json({ error: "language_code and body are required" }, { status: 400 });
    }

    const viewer = await requireSession();
    let threadMeta: { parent_id: string | null; root_id: string | null; depth: number };
    try {
      threadMeta = await computeThreadFields(parentFromBody || null);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid parent" },
        { status: 400 }
      );
    }

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
      parent_id: threadMeta.parent_id,
      root_id: threadMeta.root_id,
      depth: threadMeta.depth,
      parent_post_id: threadMeta.parent_id,
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
