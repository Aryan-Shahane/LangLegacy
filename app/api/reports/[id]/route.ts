import { NextRequest, NextResponse } from "next/server";
import { getDocument, putDocument } from "@/lib/cloudant";
import { requireModeratorAccess } from "@/lib/auth";
import type { Report } from "@/lib/types";
import { databaseForReportContentType, reportRefs } from "@/lib/reportHelpers";
import { siblingOpenReportsFor } from "@/lib/reports";

type Outcome = "remove_content" | "dismiss";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const moderator = await requireModeratorAccess();
    const { id } = await params;
    const body = (await req.json()) as { outcome?: Outcome };

    const outcome = body.outcome;
    if (outcome !== "remove_content" && outcome !== "dismiss") {
      return NextResponse.json({ error: "outcome must be remove_content or dismiss" }, { status: 400 });
    }

    const leadDoc = await getDocument("reports", id);
    if (!leadDoc || typeof leadDoc._rev !== "string") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    const lead = leadDoc as Report;

    let siblings = await siblingOpenReportsFor(lead);
    if (!siblings.some((s) => s._id === id)) siblings = [...siblings, lead];
    const unique = [...new Map(siblings.map((r) => [r._id, r])).values()];
    const resolvedAt = new Date().toISOString();
    const nextStatus = outcome === "remove_content" ? ("removed" as const) : ("dismissed" as const);

    await Promise.all(
      unique.map(async (r) => {
        const full = await getDocument("reports", r._id);
        if (!full || typeof full._rev !== "string") return;
        await putDocument("reports", r._id, {
          ...full,
          status: nextStatus,
          resolved_by: moderator.userId,
          resolved_at: resolvedAt,
        });
      })
    );

    if (outcome === "remove_content") {
      const { content_type, content_id } = reportRefs(lead);
      const db = databaseForReportContentType(content_type);
      const target = await getDocument(db, content_id);
      if (target && typeof target._rev === "string") {
        await putDocument(db, content_id, {
          ...target,
          status: "removed",
        });
      }
    }

    return NextResponse.json({ ok: true, updated_count: unique.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
