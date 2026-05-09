import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "@/lib/cloudant";
import { getViewerIdentityFromHeaders } from "@/lib/auth";
import type { LearningProgress } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const languageCode = req.nextUrl.searchParams.get("language_code");
    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }
    const viewer = getViewerIdentityFromHeaders(req.headers);
    const id = `${viewer.userId}:${languageCode}`;
    const progress = (await getDocument("learning_progress", id)) as LearningProgress | null;
    return NextResponse.json(
      progress || {
        _id: id,
        type: "learning_progress",
        user_id: viewer.userId,
        language_code: languageCode,
        total_sessions: 0,
        total_correct: 0,
        total_seen: 0,
        streak_days: 0,
        last_session_at: "",
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load learning progress" },
      { status: 500 }
    );
  }
}
