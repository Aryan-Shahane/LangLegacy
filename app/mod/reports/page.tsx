"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReportRow, { type ReportQueueItem } from "@/components/ReportRow";
import { Button } from "@/components/ui/button";

export default function ModReportsPage() {
  const [reports, setReports] = useState<ReportQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mod/reports", { cache: "no-store" });
      const json = (await res.json()) as ReportQueueItem[] | { error?: string };
      if (!res.ok) throw new Error("error" in json ? json.error || "Failed to load reports" : "Failed to load reports");
      setReports(Array.isArray(json) ? json : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial moderator queue hydration
    void loadReports();
  }, []);

  const resolve = async (id: string, action: "remove" | "keep") => {
    setBusy(true);
    try {
      await fetch(`/api/mod/reports/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await loadReports();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#C3C8C1]/35 pb-6">
        <div className="space-y-2">
          <nav className="text-xs font-semibold uppercase tracking-[0.16em] text-[#757C76]">
            <Link href="/mod" className="text-[#1B3022] transition hover:text-[#9F4026]">
              Overview
            </Link>
            <span className="mx-2 text-[#C3C8C1]">/</span>
            <span aria-current="page">Reports</span>
          </nav>
          <h1 className="font-serif text-4xl text-[#061B0E]">Report queue</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#434843]">
            Sorted by stacked flags · each row resolves every open report targeting the same content. Use Open in site to verify context
            before you remove.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={loading || busy} onClick={() => void loadReports()}>
          Refresh
        </Button>
      </div>
      {loading ? <p className="rounded-2xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-8 text-center text-sm text-[#757C76]">Loading queue…</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      <div className="space-y-4">
        {reports.map((report) => (
          <ReportRow key={report._id} report={report} disabled={busy} onResolve={resolve} />
        ))}
      </div>

      {!loading && reports.length === 0 && !error ? (
        <div className="rounded-3xl border border-dashed border-[#C3C8C1]/65 bg-[#F5F3EE] px-8 py-16 text-center">
          <p className="font-serif text-xl text-[#061B0E]">Queue is empty</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#434843]">Outstanding flags will rank here · check back later or refresh after other moderators resolve items.</p>
          <Link
            href="/mod"
            className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-[#1B3022] underline-offset-4 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      ) : null}
    </div>
  );
}
