import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, saveDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
import { coerceMessage } from "@/lib/messageCoercion";
import type { Message } from "@/lib/types";
import { broadcast } from "@/lib/streamManager";
import {
  MOCK_MESSAGES,
  demoMessagesForRoom,
  inferLanguageFromRoomId,
} from "@/lib/mock/chatroomMockData";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const qpLang =
      req.nextUrl.searchParams.get("language_code")?.trim().toLowerCase() || "";
    const langHint =
      qpLang ||
      inferLanguageFromRoomId(roomId) ||
      "en";

    let docs: Message[] = [];

    try {
      docs = (await findDocuments(
        "messages",
        { type: "message", room_id: roomId, status: "active" },
        100,
        0
      )) as Message[];
    } catch (dbError) {
      console.warn("Cloudant unreachable, attempting bundled chat demo lines", dbError);
      docs = [];
    }

    if (docs.length === 0) {
      const seeded = MOCK_MESSAGES[roomId];
      docs =
        seeded && seeded.length > 0
          ? seeded
          : demoMessagesForRoom(roomId, langHint);
    }

    const normalized = (docs as unknown as Record<string, unknown>[]).map((d) => coerceMessage(d));
    const ts = (m: Message) => (typeof m.created_at === "string" ? m.created_at : "");
    normalized.sort((a, b) => ts(a).localeCompare(ts(b)));
    return NextResponse.json(normalized.slice(-50));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = (await req.json()) as { language_code?: string; body?: string; author_name?: string };
    const text = (body.body || "").trim();
    if (!body.language_code || !text) {
      return NextResponse.json({ error: "language_code and body are required" }, { status: 400 });
    }
    const viewer = await requireSession();
    const message: Message = {
      _id: randomUUID(),
      type: "message",
      room_id: roomId,
      language_code: body.language_code,
      author_id: viewer.userId,
      author_name: body.author_name?.trim() || viewer.name,
      body: text,
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    };
    
    let saved: Message;
    try {
      saved = (await saveDocument("messages", message as unknown as Record<string, unknown>)) as unknown as Message;
    } catch (dbError) {
      console.warn("Message save failed (Cloudant unreachable or misconfigured):", dbError);
      return NextResponse.json(
        {
          error:
            "Could not save this message to the archive. Check Cloudant credentials and connectivity so everyone can load the thread.",
        },
        { status: 503 }
      );
    }

    // Fan out via SSE only after durable write — all connected clients see the same payload.
    broadcast(roomId, saved);

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 }
    );
  }
}
