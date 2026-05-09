"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ReportReason, ReportTargetType } from "@/lib/types";

const PUBLIC_REASONS: Array<{ id: ReportReason; label: string }> = [
  { id: "inaccurate_translation", label: "Inaccurate translation" },
  { id: "offensive_content", label: "Offensive content" },
  { id: "incorrect_audio", label: "Incorrect audio" },
  { id: "spam", label: "Spam" },
  { id: "other", label: "Other" },
];

/** Legacy moderation queue still accepts abbreviated reasons via dedicated routes */
const LEGACY_REASONS: Array<{ id: ReportReason; label: string }> = [
  { id: "inaccurate", label: "Inaccurate / misleading" },
  { id: "offensive", label: "Offensive or harmful" },
  { id: "spam", label: "Spam" },
  { id: "other", label: "Other" },
];

type UnifiedProps = {
  contentType: ReportTargetType;
  contentId: string;
  languageCode: string;
  compact?: boolean;
};

type LegacyProps = {
  compact?: boolean;
  onSubmit: (payload: { reason: ReportReason; details: string }) => Promise<void> | void;
};

function propsAreUnified(props: UnifiedProps | LegacyProps): props is UnifiedProps {
  return "contentType" in props && "contentId" in props && "languageCode" in props;
}

export default function ReportModal(props: UnifiedProps | LegacyProps) {
  const unified = propsAreUnified(props);
  const compact = props.compact;
  const reasonList = unified ? PUBLIC_REASONS : LEGACY_REASONS;

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(reasonList[0].id);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    try {
      if (unified) {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_type: props.contentType,
            content_id: props.contentId,
            language_code: props.languageCode,
            reason,
            note: details,
          }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || "Report failed.");
        }
        setDoneMessage("Thank you — a moderator will review this");
      } else {
        await props.onSubmit({ reason, details });
        setOpen(false);
        setDetails("");
        setReason(reasonList[0].id);
      }
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
        className={
          compact
            ? "!h-auto min-h-8 rounded-md border-transparent bg-transparent px-2 py-1 text-[11px] text-[#734010] underline-offset-4 hover:underline"
            : ""
        }
        aria-label={compact ? "Report this content" : undefined}
        onClick={() => {
          setDoneMessage(null);
          setOpen((v) => !v);
        }}
      >
        {compact ? "🚩 Flag" : "Report"}
      </Button>
      {open ? (
        <Card className="absolute right-0 z-20 mt-2 w-[min(100vw-2rem,20rem)] space-y-2 p-3 text-xs shadow-xl">
          {doneMessage ? (
            <p className="text-center text-sm leading-relaxed text-[#1B3022]">{doneMessage}</p>
          ) : (
            <>
              <p className="font-medium text-[#1B1C19]">Why are you reporting this?</p>
              {reasonList.map((r) => (
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
                placeholder="Additional details"
              />
              <Button type="button" disabled={submitting} onClick={() => void submit()} size="sm" className="w-full bg-rose-700 hover:bg-rose-600 disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit report"}
              </Button>
            </>
          )}
        </Card>
      ) : null}
    </div>
  );
}
