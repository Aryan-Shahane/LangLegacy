"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModeratorReportCard from "@/components/moderator/ModeratorReportCard";

type EnrichedReport = {
  _id: string;
  preview: string;
  reason: string;
  language_code: string;
  reporter_id?: string;
  reporter_count?: number;
  created_at?: string;
  status?: string;
  content_type?: string;
  content_id?: string;
  target_type?: string;
  target_id?: string;
  note?: string | null;
  details?: string | null;
};

const FILTER_IDS = ["all", "entry", "post", "poem", "story"] as const;
type FilterId = (typeof FILTER_IDS)[number];

export default function ModeratorQueue({
  /** When embedded on a language archive, constrain to `language_code` if provided. */
  languageCodeFilter,
}: {
  languageCodeFilter?: string;
}) {
  const [items, setItems] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/mod/reports", { cache: "no-store", credentials: "include" });
    if (!res.ok) {
      if (res.status === 403) throw new Error("You need moderator permissions to view the queue.");
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || "Failed to load reports.");
    }
    setItems((await res.json()) as EnrichedReport[]);
  }, []);

  useEffect(() => {
    let m = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await load();
      } catch (e) {
        if (m) setError(e instanceof Error ? e.message : "Error");
      }
      if (m) setLoading(false);
    })();
    return () => {
      m = false;
    };
  }, [load]);

  useEffect(() => {
    const onEvt = () => void load().catch(() => {});
    window.addEventListener("ll-report-action", onEvt);
    return () => window.removeEventListener("ll-report-action", onEvt);
  }, [load]);

  const filtered = useMemo(() => {
    const langFiltered = languageCodeFilter
      ? items.filter((i) => i.language_code?.toLowerCase() === languageCodeFilter.toLowerCase())
      : items;
    if (filter === "all") return langFiltered;
    const t = filter;
    return langFiltered.filter((r) => (r.content_type || r.target_type) === t);
  }, [items, filter, languageCodeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[#737973]">Filter · </p>
        {FILTER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === id ? "bg-[#1B3022] text-white" : "bg-[#E8EFE9] text-[#434843]"
            }`}
          >
            {id === "all" ? "All types" : id}
          </button>
        ))}
      </div>
      {loading ? <p className="text-sm text-[#434843]">Loading queue…</p> : null}
      {!loading && error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {!loading && !error && filtered.length === 0 ? (
        <p className="text-sm text-[#757C76]">No open reports.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((report) => (
            <ModeratorReportCard key={report._id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
