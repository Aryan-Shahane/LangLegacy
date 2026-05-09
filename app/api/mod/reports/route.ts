import { NextResponse } from "next/server";
import { findDocuments, getDocument } from "@/lib/cloudant";
import { requireModeratorAccess } from "@/lib/auth";
import { databaseForReportContentType, reportRefs } from "@/lib/reportHelpers";
import type { Entry, Message, Poem, Post, Report, Story } from "@/lib/types";

export async function GET() {
  try {
    await requireModeratorAccess();
    const reports = (await findDocuments(
      "reports",
      { type: "report", status: { $in: ["open", "pending"] } },
      400,
      0
    )) as Report[];
    const enriched = await Promise.all(
      reports.map(async (r) => {
        let refs: ReturnType<typeof reportRefs>;
        try {
          refs = reportRefs(r);
        } catch {
          return { ...r, preview: "(invalid report refs)" };
        }
        const db = databaseForReportContentType(refs.content_type);
        const target =
          refs.content_type === "entry"
            ? ((await getDocument(db, refs.content_id)) as Entry | null)
            : refs.content_type === "post"
              ? ((await getDocument(db, refs.content_id)) as Post | null)
              : refs.content_type === "message"
                ? ((await getDocument(db, refs.content_id)) as Message | null)
                : refs.content_type === "poem"
                  ? ((await getDocument(db, refs.content_id)) as Poem | null)
                  : ((await getDocument(db, refs.content_id)) as Story | null);
        let preview = "(missing)";
        if (refs.content_type === "entry" && target)
          preview = `${(target as Entry).word || "?"} — ${(target as Entry).translation || ""}`;
        else if (refs.content_type === "post" && target)
          preview = (target as Post).body?.slice(0, 100) || "(missing)";
        else if (refs.content_type === "message" && target)
          preview = (target as Message).body?.slice(0, 100) || "(missing)";
        else if (refs.content_type === "poem" && target)
          preview = `${(target as Poem).title}: ${(target as Poem).body_original?.slice(0, 80) || ""}`;
        else if (refs.content_type === "story" && target)
          preview = `${(target as Story).title}: ${(target as Story).description?.slice(0, 80) || ""}`;
        return { ...r, preview };
      })
    );
    const grouped = new Map<string, number>();
    for (const report of enriched) {
      const key = `${String(report.content_type || report.target_type)}:${String(report.content_id || report.target_id)}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }
    const withCounts = enriched.map((r) => ({
      ...r,
      reporter_count:
        grouped.get(`${String(r.content_type || r.target_type)}:${String(r.content_id || r.target_id)}`) || 1,
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
