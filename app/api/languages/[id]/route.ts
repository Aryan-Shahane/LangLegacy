import { NextRequest, NextResponse } from "next/server";
import { getDocument, putDocument } from "@/lib/cloudant";
import { requireModeratorAccess } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModeratorAccess();
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      mode?: string;
      /** When false together with mode, preserves mode but lets recomputation resume. When alone, clears moderator lock only. */
      moderator_mode_lock?: boolean;
    };

    const mode = body.mode === "full" || body.mode === "archive" ? body.mode : null;
    const clearLockOnly =
      mode === null && body.moderator_mode_lock === false;

    const raw = await getDocument("languages", id);
    if (!raw || typeof raw !== "object" || typeof (raw as { _rev?: unknown })._rev !== "string") {
      return NextResponse.json({ error: "Language not found" }, { status: 404 });
    }

    const doc = raw as Record<string, unknown>;

    if (!mode && !clearLockOnly) {
      return NextResponse.json({ error: "Provide mode or moderator_mode_lock: false" }, { status: 400 });
    }

    if (clearLockOnly) {
      await putDocument("languages", id, {
        ...doc,
        moderator_mode_lock: false,
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, moderator_mode_lock: false });
    }

    const moderator_mode_lock = body.moderator_mode_lock === false ? false : true;

    await putDocument("languages", id, {
      ...doc,
      mode,
      moderator_mode_lock,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, mode, moderator_mode_lock });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update language";
    if (message === "Forbidden" || message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
