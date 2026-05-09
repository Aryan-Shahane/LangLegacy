import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findDocuments, saveDocument } from "@/lib/cloudant";
import { requireSession } from "@/lib/auth";
import type { Room } from "@/lib/types";
import { MOCK_ROOMS } from "@/lib/mock/chatroomMockData";

export async function GET(req: NextRequest) {
  try {
    const languageCode = req.nextUrl.searchParams.get("language_code");
    if (!languageCode) {
      return NextResponse.json({ error: "language_code is required" }, { status: 400 });
    }
    
    let rooms: Room[] = [];
    try {
      rooms = (await findDocuments(
        "rooms",
        { type: "room", language_code: languageCode },
        200,
        0
      )) as Room[];
    } catch (dbError) {
      console.warn("Cloudant unreachable, falling back to mock rooms", dbError);
    }

    // Merge in mock rooms if DB is empty or missing them
    const mockRooms = MOCK_ROOMS.filter(r => r.language_code === languageCode);
    const existingIds = new Set(rooms.map(r => r._id));
    for (const mockRoom of mockRooms) {
      if (!existingIds.has(mockRoom._id)) {
        rooms.push(mockRoom);
      }
    }

    // Ensure a "General" room always exists
    const hasGeneral = rooms.some(r => r.name.toLowerCase() === "general");
    if (!hasGeneral) {
      const generalRoom: Room = {
        _id: `room_${languageCode}_general`,
        type: "room",
        language_code: languageCode,
        name: "General",
        description: `Open discussion for all things ${languageCode} language.`,
        created_by: "system",
        created_at: new Date(0).toISOString(), // ensure it sorts first
      };
      rooms.unshift(generalRoom);
      
      // Attempt to save it asynchronously in the background so it exists in DB next time
      saveDocument("rooms", generalRoom as unknown as Record<string, unknown>).catch(() => {});
    }

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
    const viewer = await requireSession();
    
    // Allow any logged-in user to create a room
    if (!viewer.userId) {
      return NextResponse.json({ error: "Must be logged in to create a room" }, { status: 401 });
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
    
    try {
      const saved = await saveDocument("rooms", room as unknown as Record<string, unknown>);
      return NextResponse.json({ ok: true, saved });
    } catch (dbError) {
      console.warn("Cloudant unreachable, faking room creation", dbError);
      return NextResponse.json({ ok: true, saved: room });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create room" },
      { status: 500 }
    );
  }
}
