import { NextRequest, NextResponse } from "next/server";
import { getViewerIdentityFromHeaders } from "@/lib/auth";
import { createReportAndMarkTarget } from "@/lib/reports";
import type { ReportReason } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json()) as { reason?: ReportReason; details?: string; language_code?: string };
    if (!body.reason || !body.language_code) {
      return NextResponse.json({ error: "reason and language_code are required" }, { status: 400 });
    }
    const viewer = getViewerIdentityFromHeaders(req.headers);
    const saved = await createReportAndMarkTarget({
      targetType: "message",
      targetId: params.id,
      languageCode: body.language_code,
      reporterId: viewer.userId,
      reason: body.reason,
      details: body.details,
      targetDb: "messages",
    });
    return NextResponse.json({ ok: true, saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to report message" },
      { status: 500 }
    );
  }
}
