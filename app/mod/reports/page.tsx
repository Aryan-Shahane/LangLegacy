"use client";

import { useEffect, useState } from "react";
import ReportRow from "@/components/ReportRow";

type QueueItem = {
  _id: string;
  target_type: string;
  language_code: string;
  reason: string;
  preview: string;
  reporter_count: number;
};

export default function ModReportsPage() {
  const [reports, setReports] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mod/reports");
      const json = (await res.json()) as QueueItem[] | { error?: string };
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
    await fetch(`/api/mod/reports/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadReports();
  };

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold text-slate-100">Report queue</h1>
      {loading ? <p className="text-sm text-slate-500">Loading reports...</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="space-y-2">
        {reports.map((report) => (
          <ReportRow key={report._id} report={report} onResolve={resolve} />
        ))}
      </div>
      {!loading && reports.length === 0 ? (
        <p className="text-sm text-slate-500">No open reports.</p>
      ) : null}
    </section>
  );
}
