"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ModeratorReportCard({
  report,
}: {
  report: {
    _id: string;
    preview: string;
    reason: string;
    language_code: string;
    reporter_id?: string;
    reporter_count?: number;
    created_at?: string;
    content_type?: string;
    content_id?: string;
    target_type?: string;
    target_id?: string;
    note?: string | null;
    details?: string | null;
    status?: string;
  };
}) {
  const [busy, setBusy] = useState<"rm" | "ds" | null>(null);
  const [contentRemoved, setContentRemoved] = useState(false);

  const act = async (outcome: "remove_content" | "dismiss") => {
    setBusy(outcome === "remove_content" ? "rm" : "ds");
    try {
      const res = await fetch(`/api/reports/${report._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Failed (${res.status})`);
      }
      if (outcome === "remove_content") {
        setContentRemoved(true);
        window.setTimeout(() => {
          window.dispatchEvent(new Event("ll-report-action"));
        }, 1000);
      } else {
        window.dispatchEvent(new Event("ll-report-action"));
      }
    } finally {
      setBusy(null);
    }
  };

  const kind = report.content_type || report.target_type || "?";
  const extra = report.note?.trim() || report.details?.trim() || "";

  return (
    <Card
      className={
        contentRemoved
          ? "pointer-events-none space-y-3 border-[#C9C9C9]/65 bg-[#E8E6E2]/90 p-4 opacity-65 grayscale-[0.35] shadow-inner"
          : "space-y-3 border-[#C3C8C1]/35 bg-[#F5F3EE] p-4"
      }
    >
      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em] text-[#757C76]">
        <span className="rounded-full bg-[#E8EFE9] px-2 py-1 font-semibold text-[#061B0E]">{kind}</span>
        <span className="rounded-full px-2 py-1">{report.language_code}</span>
        {report.created_at ? <span>{new Date(report.created_at).toLocaleString()}</span> : null}
        {report.reporter_count !== undefined ? (
          <span className="rounded-full bg-amber-50 px-2 py-1 font-medium text-[#734010]">{report.reporter_count} flagged</span>
        ) : null}
      </div>
      <p className="text-sm font-medium text-[#061B0E]">Reason: {report.reason}</p>
      {extra ? (
        <p className="text-sm leading-relaxed text-[#434843]">{extra}</p>
      ) : (
        <p className="text-sm text-[#757C76]">No note from reporter.</p>
      )}
      <p
        className={
          contentRemoved
            ? "rounded-lg border border-[#BFBDB9]/65 bg-[#F0EEEE] p-3 text-sm text-[#6E7470]"
            : "rounded-lg border border-[#C3C8C1]/40 bg-[#FBF9F4] p-3 text-sm text-[#1B1C19]"
        }
      >
        {report.preview}
      </p>
      <p className="text-[11px] text-[#757C76]">Reporter · {report.reporter_id || "anonymous"}</p>
      {contentRemoved ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#878C87]">Content removed · refreshing…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-rose-800 hover:bg-rose-700"
            disabled={busy !== null}
            onClick={() => void act("remove_content")}
          >
            {busy === "rm" ? "Removing…" : "Remove content"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => void act("dismiss")}
          >
            {busy === "ds" ? "Dismiss…" : "Dismiss report"}
          </Button>
        </div>
      )}
    </Card>
  );
}
