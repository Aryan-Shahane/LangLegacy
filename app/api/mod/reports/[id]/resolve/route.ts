import { NextRequest, NextResponse } from "next/server";
import { findDocuments, getDocument, putDocument } from "@/lib/cloudant";
import { requireModeratorAccess } from "@/lib/auth";
import { databaseForReportContentType, reportRefs } from "@/lib/reportHelpers";
import type { Report, ReportTargetType } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const moderator = await requireModeratorAccess();
    const body = (await req.json()) as { action?: "remove" | "keep" };
    if (body.action !== "remove" && body.action !== "keep") {
      return NextResponse.json({ error: "action must be remove or keep" }, { status: 400 });
    }

    const report = (await getDocument("reports", id)) as (Report & { _rev?: string }) | null;
    if (!report || typeof report._rev !== "string") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    let ctype: ReportTargetType;
    let cid: string;
    try {
      const ref = reportRefs(report);
      ctype = ref.content_type;
      cid = ref.content_id;
    } catch {
      return NextResponse.json({ error: "Invalid report refs" }, { status: 400 });
    }

    const openFamily = (await findDocuments(
      "reports",
      { type: "report", status: { $in: ["pending", "open"] } },
      200,
      0
    )) as Array<Report & { _rev?: string }>;

    const related = openFamily.filter((r) => {
      try {
        const ref = reportRefs(r);
        return ref.content_type === ctype && ref.content_id === cid;
      } catch {
        return (
          r.target_type === ctype && r.target_id === cid && (r.status === "open" || r.status === "pending")
        );
      }
    });

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
      const targetDb = databaseForReportContentType(ctype);
      const target = await getDocument(targetDb, cid);
      if (target && typeof target._rev === "string") {
        await putDocument(targetDb, cid, {
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
