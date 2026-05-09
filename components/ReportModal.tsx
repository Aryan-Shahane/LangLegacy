"use client";

import { useState } from "react";
import type { ReportReason } from "@/lib/types";

const REASONS: Array<{ id: ReportReason; label: string }> = [
  { id: "inaccurate", label: "Inaccurate / misleading" },
  { id: "offensive", label: "Offensive or harmful" },
  { id: "spam", label: "Spam" },
  { id: "other", label: "Other" },
];

export default function ReportModal({
  onSubmit,
  compact,
}: {
  onSubmit: (payload: { reason: ReportReason; details: string }) => Promise<void> | void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("inaccurate");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ reason, details });
      setOpen(false);
      setDetails("");
      setReason("inaccurate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className={`rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800 ${compact ? "" : "w-full"}`}
        onClick={() => setOpen((v) => !v)}
      >
        ⚑ Report
      </button>
      {open ? (
        <div className="mt-2 space-y-2 rounded border border-slate-700 bg-slate-950 p-3 text-xs">
          <p className="font-medium text-slate-200">Why are you reporting this?</p>
          {REASONS.map((r) => (
            <label key={r.id} className="block cursor-pointer text-slate-300">
              <input
                type="radio"
                name="report-reason"
                className="mr-2"
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
              />
              {r.label}
            </label>
          ))}
          <textarea
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
            rows={2}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Optional details"
          />
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="rounded bg-rose-700 px-2 py-1 text-xs hover:bg-rose-600 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit report"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
