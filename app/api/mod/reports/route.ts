import { NextResponse } from "next/server";
import { findDocuments, getDocument } from "@/lib/cloudant";
import { requireModeratorOrAdmin } from "@/lib/auth";
import type { Entry, Message, Post, Report } from "@/lib/types";

export async function GET() {
  try {
    await requireModeratorOrAdmin();
    const reports = (await findDocuments("reports", { type: "report", status: "open" }, 400, 0)) as Report[];
    const enriched = await Promise.all(
      reports.map(async (r) => {
        const db = r.target_type === "entry" ? "entries" : r.target_type === "post" ? "posts" : "messages";
        const target = (await getDocument(db, r.target_id)) as Entry | Post | Message | null;
        return {
          ...r,
          preview:
            r.target_type === "entry"
              ? `${(target as Entry | null)?.word || "(missing)"} — ${(target as Entry | null)?.translation || ""}`
              : (target as Post | Message | null)?.body?.slice(0, 100) || "(missing)",
        };
      })
    );
    const grouped = new Map<string, number>();
    for (const report of enriched) {
      const key = `${report.target_type}:${report.target_id}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }
    const withCounts = enriched.map((r) => ({
      ...r,
      reporter_count: grouped.get(`${r.target_type}:${r.target_id}`) || 1,
    }));
    withCounts.sort((a, b) => b.reporter_count - a.reporter_count);
    return NextResponse.json(withCounts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load report queue";
    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
