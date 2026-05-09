import { NextRequest, NextResponse } from "next/server";
import { findDocuments } from "@/lib/cloudant";
import { requireModeratorAccess, requireSession } from "@/lib/auth";
import { submitContentReport } from "@/lib/reports";
import type { ReportReason, ReportTargetType } from "@/lib/types";

const COMMUNITY_REASONS: ReportReason[] = [
  "inaccurate_translation",
  "offensive_content",
  "incorrect_audio",
  "spam",
  "other",
  "inaccurate",
  "offensive",
];

function isKnownReason(r: unknown): r is ReportReason {
  return typeof r === "string" && COMMUNITY_REASONS.includes(r as ReportReason);
}

const CONTENT_TYPES: ReportTargetType[] = ["entry", "post", "poem", "story"];

function isReportContentType(v: unknown): v is ReportTargetType {
  return typeof v === "string" && CONTENT_TYPES.includes(v as ReportTargetType);
}

export async function GET(req: NextRequest) {
  try {
    await requireModeratorAccess();
    const status = req.nextUrl.searchParams.get("status");
    let selector: Record<string, unknown>;
    if (!status || status === "pending") {
      selector = { type: "report", status: { $in: ["pending", "open"] } };
    } else if (status === "open") {
      selector = { type: "report", status: "open" };
    } else if (status === "resolved") {
      selector = {
        type: "report",
        status: { $in: ["resolved_removed", "resolved_kept", "removed", "dismissed"] },
      };
    } else {
      return NextResponse.json({ error: "invalid status filter" }, { status: 400 });
    }
    const reports = await findDocuments("reports", selector, 400, 0);
    return NextResponse.json(reports);
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const content_type = body.content_type;
    const content_id = typeof body.content_id === "string" ? body.content_id.trim() : "";
    const language_code = typeof body.language_code === "string" ? body.language_code.trim() : "";
    const reason = body.reason;
    const noteRaw = typeof body.note === "string" ? body.note : typeof body.details === "string" ? body.details : "";

    if (!isReportContentType(content_type)) {
      return NextResponse.json({ error: "invalid content_type" }, { status: 400 });
    }
    if (!content_id || !language_code || !isKnownReason(reason)) {
      return NextResponse.json(
        { error: "content_id, language_code, and reason are required" },
        { status: 400 }
      );
    }
    const viewer = await requireSession();
    await submitContentReport({
      contentType: content_type,
      contentId: content_id,
      languageCode: language_code,
      reporterId: viewer.userId,
      reason,
      note: noteRaw.trim() || null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "report failed" },
      { status: 500 }
    );
  }
}
