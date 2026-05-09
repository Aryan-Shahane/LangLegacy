import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ReportTargetType } from "@/lib/types";

export type ReportQueueItem = {
  _id: string;
  target_type?: ReportTargetType;
  /** Preferred unified field when present */
  content_type?: ReportTargetType;
  content_id?: string;
  target_id?: string;
  language_code: string;
  reason: string;
  preview: string;
  reporter_count: number;
};

function openInArchiveHref(report: ReportQueueItem): string {
  const lc = (report.language_code || "").trim();
  const ct = report.content_type || report.target_type;
  if (!lc) return "/";
  if (ct === "entry") return `/${lc}`;
  if (ct === "post") return `/${lc}?tab=community&section=forum`;
  if (ct === "poem") return `/${lc}?tab=community&section=poetry`;
  if (ct === "story") return `/${lc}?tab=community&section=storytelling`;
  if (ct === "message") return `/${lc}?tab=community&section=chat`;
  return `/${lc}`;
}

const typeLabels: Partial<Record<ReportTargetType, string>> = {
  entry: "Dictionary entry",
  post: "Forum post",
  message: "Chat message",
  poem: "Poem",
  story: "Story",
};

export default function ReportRow({
  report,
  onResolve,
  disabled,
  resolvedRemove,
}: {
  report: ReportQueueItem;
  onResolve: (id: string, action: "remove" | "keep") => Promise<void>;
  disabled?: boolean;
  /** Content was removed (moderator queue feedback). */
  resolvedRemove?: boolean;
}) {
  const ct = report.content_type || report.target_type || "post";
  const typeLabel = typeLabels[ct] || String(ct);
  const grey = Boolean(resolvedRemove);

  return (
    <article
      className={
        grey
          ? "pointer-events-none rounded-3xl border border-[#C9C9C9]/65 bg-[#E8E6E2]/90 p-5 opacity-65 shadow-inner grayscale-[0.35]"
          : "rounded-3xl border border-[#C3C8C1]/35 bg-[#FBF9F4] p-5 shadow-sm"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#C3C8C1]/35 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#1B3022] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            {typeLabel}
          </span>
          <span className="rounded-full bg-[#E8EFE9] px-3 py-1 font-mono text-xs font-medium text-[#1B3022]">{report.language_code}</span>
          <span className="rounded-full border border-[#C3C8C1]/55 bg-[#F5F3EE] px-3 py-1 text-[11px] text-[#434843]">Reason · {report.reason}</span>
          <span className="rounded-full bg-[#FFF4E8] px-3 py-1 text-[11px] font-semibold text-[#8A3918]">{report.reporter_count} flag(s)</span>
        </div>
        <Link
          href={openInArchiveHref(report)}
          className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1B3022] underline-offset-4 hover:text-[#9F4026] hover:underline"
        >
          Open in site →
        </Link>
      </div>
      <p
        className={
          grey ? "mt-4 text-sm leading-relaxed text-[#6E7470]" : "mt-4 text-sm leading-relaxed text-[#1B1C19]"
        }
      >
        {report.preview}
      </p>
      {grey ? (
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#878C87]">Content removed · refreshing queue…</p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="primary" size="sm" disabled={disabled} onClick={() => void onResolve(report._id, "remove")}>
            Remove content
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => void onResolve(report._id, "keep")}>
            Keep & dismiss
          </Button>
        </div>
      )}
      {!grey ? (
        <p className="mt-3 text-[11px] leading-relaxed text-[#757C76]">
          Remove marks the targeted content inactive everywhere. Keep resolves all grouped flags for this target without deleting it.
        </p>
      ) : null}
    </article>
  );
}
