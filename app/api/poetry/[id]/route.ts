import { NextRequest, NextResponse } from "next/server";
import { getDocument, putDocument } from "@/lib/cloudant";
import { getSessionFromCookie } from "@/lib/auth";
import { isEnvModerator } from "@/lib/moderator";
import type { Poem } from "@/lib/types";

function canModerate(role: string | undefined, userId: string): boolean {
  return role === "moderator" || role === "admin" || isEnvModerator(userId);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewer = await getSessionFromCookie();
    if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const raw = await getDocument("poetry", id);
    if (!raw || typeof raw._rev !== "string") {
      return NextResponse.json({ error: "Poem not found" }, { status: 404 });
    }
    const poem = raw as unknown as Poem;
    if (poem.author_id !== viewer.userId && !canModerate(viewer.role, viewer.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const updated = await putDocument("poetry", id, {
      ...raw,
      status: "removed",
    });
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 }
    );
  }
}
