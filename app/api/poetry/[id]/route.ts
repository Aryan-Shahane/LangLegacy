import { NextRequest, NextResponse } from "next/server";
import { getDocument, putDocument } from "@/lib/cloudant";
import { getSessionFromCookie } from "@/lib/auth";
import { translateTextWithAI } from "@/lib/featherless";
import { languageIsArchiveMode } from "@/lib/languageArchive";
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

/** Re-run dictionary gloss against the latest Dictionary entries (author or moderator). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      /* empty body */
    }
    if (body.refresh_gloss !== true) {
      return NextResponse.json({ error: "Set refresh_gloss: true to recompute the glossary line." }, { status: 400 });
    }

    const viewer = await getSessionFromCookie();
    if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await getDocument("poetry", id);
    if (!raw || typeof raw._rev !== "string") {
      return NextResponse.json({ error: "Poem not found" }, { status: 404 });
    }

    const poem = raw as unknown as Poem;
    const owns =
      typeof poem.author_id === "string" && poem.author_id.length > 0 && poem.author_id === viewer.userId;
    const mod = canModerate(viewer.role, viewer.userId);
    if (!owns && !mod) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const archive = await languageIsArchiveMode(poem.language_code);
    let body_translation = "";
    if (!archive) {
      try {
        body_translation = await translateTextWithAI(poem.body_original, poem.language_code);
      } catch (e) {
        console.error("AI translation failed, fallback to empty", e);
      }
    }

    const updated = await putDocument("poetry", id, {
      ...raw,
      body_translation,
    });
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 }
    );
  }
}
