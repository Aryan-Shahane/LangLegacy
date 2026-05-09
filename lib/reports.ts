import { randomUUID } from "crypto";
import { findDocuments, getDocument, putDocument, saveDocument } from "@/lib/cloudant";
import { databaseForReportContentType, reportRefs } from "@/lib/reportHelpers";
import type { Report, ReportReason, ReportTargetType } from "@/lib/types";

export async function createReportAndMarkTarget(params: {
  targetType: ReportTargetType;
  targetId: string;
  languageCode: string;
  reporterId: string;
  reason: ReportReason;
  details?: string | null;
  targetDb: "entries" | "posts" | "messages";
}) {
  const target = await getDocument(params.targetDb, params.targetId);
  if (!target || typeof target._rev !== "string") {
    throw new Error("Target not found");
  }

  const currentCount = typeof target.report_count === "number" ? target.report_count : 0;
  const currentStatus = typeof target.status === "string" ? target.status : "active";
  await putDocument(params.targetDb, params.targetId, {
    ...target,
    report_count: currentCount + 1,
    status: currentStatus === "removed" ? "removed" : "under_review",
  });

  const report: Report = {
    _id: randomUUID(),
    type: "report",
    target_type: params.targetType,
    target_id: params.targetId,
    content_type: params.targetType,
    content_id: params.targetId,
    language_code: params.languageCode,
    reporter_id: params.reporterId,
    reason: params.reason,
    details: params.details?.trim() || null,
    note: null,
    status: "open",
    resolved_by: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
  };
  return saveDocument("reports", report as unknown as Record<string, unknown>);
}

/** COMMUNITY.md `POST /api/reports` — pending queue + mirrored target_type for legacy mod tooling. */
export async function submitContentReport(params: {
  contentType: ReportTargetType;
  contentId: string;
  languageCode: string;
  reporterId: string;
  reason: ReportReason;
  note?: string | null;
}) {
  const db = databaseForReportContentType(params.contentType);
  const target = await getDocument(db, params.contentId);
  if (!target || typeof target._rev !== "string") {
    throw new Error("Target not found");
  }

  const currentCount = typeof target.report_count === "number" ? target.report_count : 0;
  const currentStatus = typeof target.status === "string" ? target.status : "active";
  if (db !== "messages") {
    await putDocument(db, params.contentId, {
      ...target,
      report_count: currentCount + 1,
      status: currentStatus === "removed" ? "removed" : "under_review",
    });
  }

  const resolvedStatus: Report["status"] = "pending";

  const report: Report = {
    _id: randomUUID(),
    type: "report",
    content_type: params.contentType,
    content_id: params.contentId,
    target_type: params.contentType,
    target_id: params.contentId,
    language_code: params.languageCode,
    reporter_id: params.reporterId,
    reason: params.reason,
    note: params.note?.trim() || null,
    details: null,
    status: resolvedStatus,
    resolved_by: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
  };
  return saveDocument("reports", report as unknown as Record<string, unknown>);
}

/** Find open/pending reports for the same flagged content as `lead`. */
export async function siblingOpenReportsFor(lead: Report): Promise<Report[]> {
  const { content_type, content_id } = reportRefs(lead);
  const all = (await findDocuments(
    "reports",
    { type: "report", status: { $in: ["pending", "open"] } },
    500,
    0
  )) as Report[];
  return all.filter((r) => {
    try {
      const ref = reportRefs(r);
      return ref.content_type === content_type && ref.content_id === content_id;
    } catch {
      return false;
    }
  });
}
