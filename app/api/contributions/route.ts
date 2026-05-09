import { NextRequest, NextResponse } from "next/server";
import { findDocuments } from "@/lib/cloudant";
import { coerceEntry } from "@/lib/entryCoercion";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 8)));
    const docs = (await findDocuments(
      "entries",
      {
        $and: [
          { type: "entry" },
          { $or: [{ status: { $exists: false } }, { status: "active" }, { status: "under_review" }] },
        ],
      },
      200,
      0
    )) as Record<string, unknown>[];
    const normalized = docs.map(coerceEntry).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json(normalized.slice(0, limit));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load recent contributions" },
      { status: 500 }
    );
  }
}
