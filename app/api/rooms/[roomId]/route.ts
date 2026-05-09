import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "@/lib/cloudant";
import { MOCK_ROOMS } from "@/lib/mock/chatroomMockData";
import type { Room } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    
    let roomDoc = null;
    try {
      roomDoc = await getDocument("rooms", roomId);
    } catch (error) {
      console.warn("Cloudant unreachable for single room, falling back to mock");
    }

    if (roomDoc) {
      return NextResponse.json(roomDoc);
    }

    const mockRoom = MOCK_ROOMS.find(r => r._id === roomId);
    if (mockRoom) {
      return NextResponse.json(mockRoom);
    }

    // Dynamic fallback for the general room if not in DB and not in MOCK_ROOMS
    if (roomId.endsWith("_general")) {
      const lang = roomId.split("_")[1] || "unknown";
      return NextResponse.json({
        _id: roomId,
        type: "room",
        language_code: lang,
        name: "General",
        description: `Open discussion for all things ${lang} language.`,
        created_by: "system",
        created_at: new Date(0).toISOString(),
      });
    }

    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch room" },
      { status: 500 }
    );
  }
}
