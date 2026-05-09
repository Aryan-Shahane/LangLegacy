import { randomUUID } from "crypto";
import { getDocument, putDocument, saveDocument } from "@/lib/cloudant";
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
    language_code: params.languageCode,
    reporter_id: params.reporterId,
    reason: params.reason,
    details: params.details?.trim() || null,
    status: "open",
    resolved_by: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
  };
  return saveDocument("reports", report as unknown as Record<string, unknown>);
}
