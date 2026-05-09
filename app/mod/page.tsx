import Link from "next/link";
import { findDocuments } from "@/lib/cloudant";
import ModStats from "@/components/ModStats";
import type { Report } from "@/lib/types";

export default async function ModOverviewPage() {
  const reports = (await findDocuments(
    "reports",
    { type: "report", status: { $in: ["open", "pending"] } },
    400,
    0
  )) as Report[];
  const highPriorityKeys = new Map<string, number>();
  for (const report of reports) {
    const key = `${report.content_type || report.target_type}:${report.content_id || report.target_id}`;
    highPriorityKeys.set(key, (highPriorityKeys.get(key) || 0) + 1);
  }
  const highPriority = Array.from(highPriorityKeys.values()).filter((count) => count >= 2).length;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Moderator dashboard</h1>
        <p className="text-sm text-slate-400">Review content reports and keep language spaces healthy.</p>
      </div>
      <ModStats openReports={reports.length} highPriority={highPriority} />
      <Link href="/mod/reports" className="inline-block rounded bg-cyan-700 px-3 py-2 text-sm hover:bg-cyan-600">
        Open report queue
      </Link>
    </section>
  );
}
