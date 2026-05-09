"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={compact ? "" : "w-full"}
        onClick={() => setOpen((v) => !v)}
      >
        ⚑ Report
      </Button>
      {open ? (
        <Card className="absolute right-0 z-20 mt-2 w-72 space-y-2 p-3 text-xs shadow-xl">
          <p className="font-medium text-[#1B1C19]">Why are you reporting this?</p>
          {REASONS.map((r) => (
            <label key={r.id} className="block cursor-pointer text-[#434843]">
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
          <Textarea
            className="text-xs"
            rows={2}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Optional details"
          />
          <Button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            size="sm"
            className="w-full bg-rose-700 hover:bg-rose-600 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit report"}
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
