import type { LearningProgress } from "@/lib/types";

export default function ProgressBar({
  progress,
  cardIndex,
  cardTotal,
}: {
  progress: LearningProgress;
  cardIndex?: number;
  cardTotal?: number;
}) {
  const accuracy =
    progress.total_seen > 0 ? Math.round((progress.total_correct / progress.total_seen) * 100) : 0;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-[#C3C8C1]/35 bg-[#EAE8E3] px-3 py-1 text-xs text-[#434843]">
            <span aria-hidden>🔥</span>
            <span className="font-semibold">{progress.streak_days}-day streak</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#C3C8C1]/35 bg-[#EAE8E3] px-3 py-1 text-xs text-[#434843]">
            <span aria-hidden>◎</span>
            <span className="font-semibold">{accuracy}% Accuracy</span>
          </div>
        </div>
        {typeof cardIndex === "number" && typeof cardTotal === "number" ? (
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#434843]">
            Card {cardIndex} / {cardTotal}
          </div>
        ) : null}
      </div>
      <div className="h-2 w-full rounded-full bg-[#E4E2DD]">
        <div
          className="h-2 rounded-full bg-[#819986]"
          style={{
            width:
              typeof cardIndex === "number" && typeof cardTotal === "number" && cardTotal > 0
                ? `${Math.min(100, Math.max(0, (cardIndex / cardTotal) * 100))}%`
                : "0%",
          }}
        />
      </div>
    </div>
  );
}
