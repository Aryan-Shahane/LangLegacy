export default function SessionSummary({
  seen,
  correct,
  durationSeconds,
  onRestart,
}: {
  seen: number;
  correct: number;
  durationSeconds: number;
  onRestart: () => void;
}) {
  const accuracy = seen > 0 ? Math.round((correct / seen) * 100) : 0;
  return (
    <div className="panel space-y-2">
      <p className="text-lg font-semibold text-slate-100">Session complete</p>
      <p className="text-sm text-slate-300">Cards seen: {seen}</p>
      <p className="text-sm text-slate-300">Correct: {correct}</p>
      <p className="text-sm text-slate-300">Accuracy: {accuracy}%</p>
      <p className="text-sm text-slate-300">Duration: {durationSeconds}s</p>
      <button
        type="button"
        onClick={onRestart}
        className="rounded bg-cyan-700 px-3 py-2 text-sm hover:bg-cyan-600"
      >
        Start another session
      </button>
    </div>
  );
}
