"use client";

export default function TranscriptionProgressBar({
  percent,
  phaseLabel,
}: {
  percent: number;
  phaseLabel: string;
}) {
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="space-y-2 rounded-xl border border-[#C3C8C1]/40 bg-[#FBF9F4] px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-[11px] text-[#5A665F]">
        <span className="font-medium uppercase tracking-[0.08em] text-[#434843]">{phaseLabel || "Working…"}</span>
        <span className="tabular-nums font-semibold text-[#1B3022]">{safe}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8EDE9]" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#1B3022] to-[#2D4A36] transition-[width] duration-300 ease-out"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}
