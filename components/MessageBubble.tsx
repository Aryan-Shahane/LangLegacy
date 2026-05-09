"use client";

import ReportModal from "@/components/ReportModal";
import type { Message } from "@/lib/types";

export default function MessageBubble({
  message,
  onReport,
}: {
  message: Message;
  onReport: (payload: { reason: "inaccurate" | "offensive" | "spam" | "other"; details: string }) => Promise<void>;
}) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900 p-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-xs text-slate-400">
          <span className="font-medium text-slate-200">{message.author_name}</span> ·{" "}
          {new Date(message.created_at).toLocaleTimeString()}
        </div>
        <ReportModal compact onSubmit={onReport} />
      </div>
      <p className="text-sm text-slate-100">{message.body}</p>
    </div>
  );
}
