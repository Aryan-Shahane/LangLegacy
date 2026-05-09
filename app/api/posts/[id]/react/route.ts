import { NextRequest, NextResponse } from "next/server";
import { getDocument, putDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
import type { Post } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json()) as { emoji?: string };
    const emoji = (body.emoji || "").trim();
    if (!emoji) {
      return NextResponse.json({ error: "emoji is required" }, { status: 400 });
    }
    const post = (await getDocument("posts", params.id)) as Post | null;
    if (!post || typeof (post as unknown as { _rev?: string })._rev !== "string") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const viewer = await requireSession();
    const users = { ...(post.reaction_users || {}) };
    const list = new Set(users[emoji] || []);
    if (list.has(viewer.userId)) list.delete(viewer.userId);
    else list.add(viewer.userId);
    users[emoji] = Array.from(list);

    const reactions = { ...(post.reactions || {}) };
    reactions[emoji] = users[emoji].length;
    if (reactions[emoji] <= 0) {
      delete reactions[emoji];
      delete users[emoji];
    }

    const updated = await putDocument("posts", params.id, {
      ...(post as unknown as Record<string, unknown>),
      reactions,
      reaction_users: users,
    });
    return NextResponse.json({ ok: true, updated, reactions });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to react to post" },
      { status: 500 }
    );
  }
}
