"use client";

export default function LockScreen({ translationCoverage }: { translationCoverage: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, translationCoverage)) * 100);
  const widthPct = pct;

  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-10 text-center shadow-sm">
      <p className="text-4xl" aria-hidden>
        🔒
      </p>
      <div>
        <h2 className="font-serif text-3xl text-[#061B0E]">Learn is not available yet</h2>
        <p className="mt-4 text-sm leading-relaxed text-[#434843]">
          This language is in Archive mode — English translations are still being added. Want to help? Open the Dictionary tab and
          add translations to entries.
        </p>
      </div>
      <div className="space-y-2 text-left">
        <div className="h-3 w-full overflow-hidden rounded-full bg-[#E8EDE9]">
          <div
            className="h-full rounded-full bg-[#1B3022] transition-[width]"
            style={{ width: `${widthPct}%` }}
          />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#757C76]">{pct}% translated</p>
      </div>
    </div>
  );
}
