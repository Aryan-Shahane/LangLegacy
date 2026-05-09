import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDocument, putDocument, saveDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
import type { LearningProgress, LearningSession } from "@/lib/types";

function dayStart(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      language_code?: string;
      cards_seen?: number;
      cards_correct?: number;
      duration_seconds?: number;
      user_id?: string;
    };
    const languageCode = body.language_code;
    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }

    const viewer = await requireSession();
    const userId = body.user_id || viewer.userId;
    const nowIso = new Date().toISOString();
    const cardsSeen = Math.max(0, Number(body.cards_seen || 0));
    const cardsCorrect = Math.max(0, Number(body.cards_correct || 0));
    const duration = Math.max(0, Number(body.duration_seconds || 0));

    const session: LearningSession = {
      _id: randomUUID(),
      type: "learning_session",
      user_id: userId,
      language_code: languageCode,
      cards_seen: cardsSeen,
      cards_correct: cardsCorrect,
      duration_seconds: duration,
      created_at: nowIso,
    };
    await saveDocument("learning_sessions", session as unknown as Record<string, unknown>);

    const progressId = `${userId}:${languageCode}`;
    const existing = (await getDocument("learning_progress", progressId)) as (LearningProgress & { _rev?: string }) | null;
    if (existing && typeof existing._rev === "string") {
      const lastDay = dayStart(existing.last_session_at);
      const today = dayStart(nowIso);
      const yesterday = dayStart(new Date(Date.now() - 86400000).toISOString());
      const streakDays = lastDay === today ? existing.streak_days : lastDay === yesterday ? existing.streak_days + 1 : 1;
      await putDocument("learning_progress", progressId, {
        ...existing,
        total_sessions: existing.total_sessions + 1,
        total_correct: existing.total_correct + cardsCorrect,
        total_seen: existing.total_seen + cardsSeen,
        streak_days: streakDays,
        last_session_at: nowIso,
      });
    } else {
      const progress: LearningProgress = {
        _id: progressId,
        type: "learning_progress",
        user_id: userId,
        language_code: languageCode,
        total_sessions: 1,
        total_correct: cardsCorrect,
        total_seen: cardsSeen,
        streak_days: 1,
        last_session_at: nowIso,
      };
      await putDocument("learning_progress", progressId, progress as unknown as Record<string, unknown>);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save learning session" },
      { status: 500 }
    );
  }
}
