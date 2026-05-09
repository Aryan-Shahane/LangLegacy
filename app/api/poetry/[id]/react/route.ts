import { NextRequest, NextResponse } from "next/server";
import { getDocument, putDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
import type { Poem } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { emoji?: string };
    const emoji = (body.emoji || "").trim();
    if (!emoji) {
      return NextResponse.json({ error: "emoji is required" }, { status: 400 });
    }
    const raw = await getDocument("poetry", id);
    const poem = raw as Poem | null;
    if (!poem || typeof (raw as { _rev?: string })?._rev !== "string") {
      return NextResponse.json({ error: "Poem not found" }, { status: 404 });
    }
    const viewer = await requireSession();
    const reactions = { ...(poem.reactions || {}) };
    const list = new Set(reactions[emoji] || []);
    if (list.has(viewer.userId)) list.delete(viewer.userId);
    else list.add(viewer.userId);
    reactions[emoji] = Array.from(list);
    if (reactions[emoji]?.length === 0) delete reactions[emoji];

    const updated = await putDocument("poetry", id, {
      ...(raw as Record<string, unknown>),
      reactions,
    });
    return NextResponse.json({ ok: true, updated, reactions });
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
