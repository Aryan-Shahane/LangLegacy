import { NextRequest, NextResponse } from "next/server";
import { findDocuments, getDocument, putDocument } from "@/lib/cloudant";
import { requireModeratorOrAdmin } from "@/lib/auth";
import type { Report } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const moderator = await requireModeratorOrAdmin();
    const body = (await req.json()) as { action?: "remove" | "keep" };
    if (body.action !== "remove" && body.action !== "keep") {
      return NextResponse.json({ error: "action must be remove or keep" }, { status: 400 });
    }

    const report = (await getDocument("reports", params.id)) as (Report & { _rev?: string }) | null;
    if (!report || typeof report._rev !== "string") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const related = (await findDocuments("reports", {
      type: "report",
      status: "open",
      target_type: report.target_type,
      target_id: report.target_id,
    }, 200, 0)) as Array<Report & { _rev?: string }>;

    const resolvedStatus = body.action === "remove" ? "resolved_removed" : "resolved_kept";
    const resolvedAt = new Date().toISOString();
    await Promise.all(
      related
        .filter((r) => typeof r._rev === "string")
        .map((r) =>
          putDocument("reports", r._id, {
            ...(r as unknown as Record<string, unknown>),
            status: resolvedStatus,
            resolved_by: moderator.userId,
            resolved_at: resolvedAt,
          })
        )
    );

    if (body.action === "remove") {
      const targetDb = report.target_type === "entry" ? "entries" : report.target_type === "post" ? "posts" : "messages";
      const target = await getDocument(targetDb, report.target_id);
      if (target && typeof target._rev === "string") {
        await putDocument(targetDb, report.target_id, {
          ...target,
          status: "removed",
        });
      }
    }

    return NextResponse.json({ ok: true, resolved_count: related.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve report";
    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
