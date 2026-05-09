import Link from "next/link";
import { findDocuments } from "@/lib/cloudant";
import LanguagePanel from "@/components/moderator/LanguagePanel";
import ModStats from "@/components/ModStats";
import type { Report } from "@/lib/types";

/** Shared moderator overview: open reports stats, shortcuts, languages table (used at `/` and referenced from `/mod` redirect). */
export default async function ModeratorDashboardContent() {
  const reports = (await findDocuments(
    "reports",
    { type: "report", status: { $in: ["open", "pending"] } },
    400,
    0
  )) as Report[];
  const highPriorityKeys = new Map<string, number>();
  for (const report of reports) {
    const key = `${report.content_type || report.target_type}:${report.content_id || report.target_id}`;
    highPriorityKeys.set(key, (highPriorityKeys.get(key) || 0) + 1);
  }
  const highPriority = Array.from(highPriorityKeys.values()).filter((count) => count >= 2).length;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-serif text-4xl text-[#061B0E]">Moderator dashboard</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#434843]">
          Resolve stacked flags first, then control when each language unlocks richer English tooling. High-priority items show up when multiple people flag the same target.
        </p>
      </header>

      <ModStats openReports={reports.length} highPriority={highPriority} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/mod/reports"
          className="group flex flex-col rounded-3xl border border-[#C3C8C1]/35 bg-[#FBF9F4] p-6 shadow-sm transition hover:border-[#9F4026]/45 hover:shadow-md"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#757C76]">Queue</p>
          <p className="mt-3 font-serif text-2xl text-[#061B0E]">Report queue</p>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[#434843]">
            Remove harmful content archive-wide or keep it live while dismissing duplicates.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9F4026] group-hover:text-[#802A11]">
            Open queue →
          </span>
        </Link>
        <Link
          href="#languages"
          className="group flex flex-col rounded-3xl border border-[#C3C8C1]/35 bg-[#FBF9F4] p-6 shadow-sm transition hover:border-[#1B3022]/35 hover:shadow-md"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#757C76]">Archives</p>
          <p className="mt-3 font-serif text-2xl text-[#061B0E]">Language mode</p>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[#434843]">
            Force archive vs full regardless of dictionary coverage until you clear the moderator lock.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1B3022]">
            Jump to table ↓
          </span>
        </Link>
      </div>

      <section id="languages" className="scroll-mt-28 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#C3C8C1]/35 pb-3">
          <div>
            <h2 className="font-serif text-2xl text-[#061B0E]">Languages & coverage</h2>
            <p className="mt-1 text-sm text-[#434843]">Same controls as PATCH /api/languages/[code] · visible coverage from Cloudant.</p>
          </div>
          <Link
            href="/mod/reports"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[#D0E9D4] px-4 text-xs font-semibold text-[#0B2013] transition hover:bg-[#B4CDB8]"
          >
            When in doubt · check reports first
          </Link>
        </div>
        <LanguagePanel />
      </section>
    </div>
  );
}
