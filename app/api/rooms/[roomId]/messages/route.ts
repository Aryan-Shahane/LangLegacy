import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, saveDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
import type { Message } from "@/lib/types";
import { broadcast } from "@/lib/streamManager";
import { MOCK_MESSAGES } from "@/lib/mock/chatroomMockData";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    let docs: Message[] = [];
    
    try {
      docs = (await findDocuments(
        "messages",
        { type: "message", room_id: roomId, status: "active" },
        100,
        0
      )) as Message[];
    } catch (dbError) {
      console.warn("Cloudant unreachable, falling back to mock messages");
      docs = MOCK_MESSAGES[roomId] || [];
    }

    docs.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return NextResponse.json(docs.slice(-50));
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
    
    let saved = message;
    try {
      saved = await saveDocument("messages", message as unknown as Record<string, unknown>) as Message;
    } catch (dbError) {
      console.warn("Cloudant unreachable, faking message save");
    }

    // Fan out via SSE
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
