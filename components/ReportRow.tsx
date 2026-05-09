export default function ReportRow({
  report,
  onResolve,
}: {
  report: {
    _id: string;
    target_type: string;
    language_code: string;
    reason: string;
    preview: string;
    reporter_count: number;
  };
  onResolve: (id: string, action: "remove" | "keep") => Promise<void>;
}) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-slate-800 px-2 py-1 uppercase">{report.target_type}</span>
        <span className="rounded bg-slate-800 px-2 py-1">{report.language_code}</span>
        <span className="rounded bg-slate-800 px-2 py-1">Reason: {report.reason}</span>
        <span className="rounded bg-amber-900/50 px-2 py-1">Reports: {report.reporter_count}</span>
      </div>
      <p className="text-sm text-slate-200">{report.preview}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void onResolve(report._id, "remove")}
          className="rounded bg-rose-700 px-3 py-1.5 text-xs hover:bg-rose-600"
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => void onResolve(report._id, "keep")}
          className="rounded border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-800"
        >
          Keep
        </button>
      </div>
    </div>
  );
}
