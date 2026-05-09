import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createReportAndMarkTarget } from "@/lib/reports";
import type { ReportReason } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { reason?: ReportReason; details?: string; language_code?: string };
    if (!body.reason || !body.language_code) {
      return NextResponse.json({ error: "reason and language_code are required" }, { status: 400 });
    }
    const viewer = await requireSession();
    const saved = await createReportAndMarkTarget({
      targetType: "post",
      targetId: id,
      languageCode: body.language_code,
      reporterId: viewer.userId,
      reason: body.reason,
      details: body.details,
      targetDb: "posts",
    });
    return NextResponse.json({ ok: true, saved });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to report post" },
      { status: 500 }
    );
  }
}
