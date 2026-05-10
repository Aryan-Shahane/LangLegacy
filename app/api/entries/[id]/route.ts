import { NextRequest, NextResponse } from "next/server";
import { getDocument, putDocument } from "@/lib/cloudant";
import { coerceEntry } from "@/lib/entryCoercion";
import { requireSession } from "@/lib/auth";
import { recomputeLanguageCoverage } from "@/lib/languageCoverage";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();

    const { id } = await ctx.params;
    const body = (await req.json()) as { translation?: string };
    const translation = typeof body.translation === "string" ? body.translation.trim() : "";

    if (!translation) {
      return NextResponse.json({ error: "translation is required" }, { status: 400 });
    }

    const existing = await getDocument("entries", id);
    if (!existing || (existing as { type?: string }).type !== "entry") {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const doc = existing as Record<string, unknown>;
    const merged = {
      ...doc,
      translation,
      contributor_id: typeof doc.contributor_id === "string" ? doc.contributor_id : session.userId,
      contributor_name: session.name,
      updated_at: new Date().toISOString(),
    };

    await putDocument("entries", id, merged);
    const languageCode = typeof doc.language_code === "string" ? doc.language_code : "";
    if (languageCode) await recomputeLanguageCoverage(languageCode);

    return NextResponse.json({ ok: true, entry: coerceEntry(merged) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update entry";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    // In our auth setup, requireModeratorAccess() usually exists, but since we already have session, we can just check role
    if (session.role !== "moderator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const existing = await getDocument("entries", id);
    if (!existing || (existing as { type?: string }).type !== "entry") {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Since we don't have a direct delete helper and CouchDB requires `_rev` for delete,
    // the easiest way is to soft-delete by changing the type or adding a deleted flag.
    const doc = existing as Record<string, unknown>;
    const merged = { ...doc, type: "deleted_entry", deleted_at: new Date().toISOString() };
    await putDocument("entries", id, merged);

    const languageCode = typeof doc.language_code === "string" ? doc.language_code : "";
    if (languageCode) await recomputeLanguageCoverage(languageCode);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete entry";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
