import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, saveDocument } from "@/lib/cloudant";
import { getViewerIdentityFromHeaders } from "@/lib/auth";
import type { Room } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const languageCode = req.nextUrl.searchParams.get("language_code");
    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }
    const rooms = (await findDocuments(
      "rooms",
      { type: "room", language_code: languageCode },
      200,
      0
    )) as Room[];
    rooms.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { language_code?: string; name?: string; description?: string };
    const viewer = getViewerIdentityFromHeaders(req.headers);
    if (viewer.role !== "moderator" && viewer.role !== "admin") {
      return NextResponse.json({ error: "Only moderators can create rooms" }, { status: 403 });
    }
    if (!body.language_code || !body.name) {
      return NextResponse.json({ error: "language_code and name are required" }, { status: 400 });
    }

    const room: Room = {
      _id: randomUUID(),
      type: "room",
      language_code: body.language_code,
      name: body.name.trim(),
      description: (body.description || "").trim() || "Open discussion",
      created_by: viewer.userId,
      created_at: new Date().toISOString(),
    };
    const saved = await saveDocument("rooms", room as unknown as Record<string, unknown>);
    return NextResponse.json({ ok: true, saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create room" },
      { status: 500 }
    );
  }
}
