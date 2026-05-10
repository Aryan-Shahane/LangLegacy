"use client";

import ReportModal from "@/components/ReportModal";
import type { Message, ReportReason } from "@/lib/types";

export default function MessageBubble({
  message,
  isOwn,
  onReport,
}: {
  message: Message;
  isOwn?: boolean;
  onReport: (payload: { reason: ReportReason; details: string }) => Promise<void>;
}) {
  const created = message.created_at ? new Date(message.created_at) : null;
  const time =
    created && !Number.isNaN(created.getTime())
      ? created.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "";

  return (
    <div className={`group flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] space-y-1 ${isOwn ? "items-end" : "items-start"}`}>
        <div className={`flex items-center gap-2 text-[11px] ${isOwn ? "justify-end text-[#7F5D54]" : "text-[#6F746E]"}`}>
          {isOwn || message.author_name?.trim() ? (
            <span className="font-medium">{isOwn ? "You" : message.author_name?.trim()}</span>
          ) : null}
          <span>{time}</span>
        </div>
        <div
          className={`rounded-2xl border px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
            isOwn
              ? "rounded-tr-md border-[#9F4026]/45 bg-[#9F4026] text-white"
              : "rounded-tl-md border-[#C3C8C1]/35 bg-[#FFFFFF]/90 text-[#1B1C19]"
          }`}
        >
          {(message.body ?? "").trim() || <span className="opacity-60">…</span>}
        </div>
        <div className={`${isOwn ? "flex justify-end" : "flex justify-start"} opacity-0 transition-opacity group-hover:opacity-100`}>
          <ReportModal compact onSubmit={onReport} />
        </div>
      </div>
    </div>
  );
}
