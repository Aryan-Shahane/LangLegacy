export default function ModStats({
  openReports,
  highPriority,
}: {
  openReports: number;
  highPriority: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#757C76]">Open reports</p>
        <p className="mt-3 font-serif text-4xl text-[#061B0E]">{openReports}</p>
        <p className="mt-2 text-xs leading-relaxed text-[#434843]">Across all targets · pending moderator review</p>
      </div>
      <div className="rounded-3xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#757C76]">High priority</p>
        <p className="mt-3 font-serif text-4xl text-[#9F4026]">{highPriority}</p>
        <p className="mt-2 text-xs leading-relaxed text-[#434843]">Items reported by two or more people</p>
      </div>
    </div>
  );
}
