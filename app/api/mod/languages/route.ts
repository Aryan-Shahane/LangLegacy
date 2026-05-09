import { NextRequest, NextResponse } from "next/server";
import { putDocument } from "@/lib/cloudant";
import { requireModeratorAccess } from "@/lib/auth";
import { resolveEditableLanguage } from "@/lib/languageDocumentResolve";

export const dynamic = "force-dynamic";

/**
 * Stable moderator entrypoint for language mode updates (avoids dynamic `/api/languages/[id]` routing quirks).
 */
export async function POST(req: NextRequest) {
  try {
    await requireModeratorAccess();

    const body = (await req.json()) as {
      language_code?: string;
      code?: string;
      mode?: string;
      moderator_mode_lock?: boolean;
    };

    const rawCode = (typeof body.language_code === "string" ? body.language_code : body.code || "").trim();

    const mode = body.mode === "full" || body.mode === "archive" ? body.mode : null;
    const clearLockOnly = mode === null && body.moderator_mode_lock === false;

    if (!rawCode) {
      return NextResponse.json({ error: "language_code is required." }, { status: 400 });
    }

    if (!mode && !clearLockOnly) {
      return NextResponse.json({ error: "Provide mode or moderator_mode_lock: false." }, { status: 400 });
    }

    const resolved = await resolveEditableLanguage(rawCode);
    if (!resolved) {
      return NextResponse.json({ error: "Language not found" }, { status: 404 });
    }

    const { doc, couchId } = resolved;

    if (clearLockOnly) {
      await putDocument("languages", couchId, {
        ...doc,
        moderator_mode_lock: false,
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, moderator_mode_lock: false });
    }

    const moderator_mode_lock = body.moderator_mode_lock === false ? false : true;

    await putDocument("languages", couchId, {
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
