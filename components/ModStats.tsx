export default function ModStats({
  openReports,
  highPriority,
}: {
  openReports: number;
  highPriority: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="panel">
        <p className="text-xs text-slate-500">Open reports</p>
        <p className="text-2xl font-semibold text-slate-100">{openReports}</p>
      </div>
      <div className="panel">
        <p className="text-xs text-slate-500">High-priority items (2+ reports)</p>
        <p className="text-2xl font-semibold text-slate-100">{highPriority}</p>
      </div>
    </div>
  );
}
