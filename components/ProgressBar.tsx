import type { LearningProgress } from "@/lib/types";

export default function ProgressBar({ progress }: { progress: LearningProgress }) {
  const accuracy =
    progress.total_seen > 0 ? Math.round((progress.total_correct / progress.total_seen) * 100) : 0;
  return (
    <div className="panel grid gap-2 sm:grid-cols-3">
      <p className="text-sm text-slate-300">Sessions: {progress.total_sessions}</p>
      <p className="text-sm text-slate-300">Accuracy: {accuracy}%</p>
      <p className="text-sm text-slate-300">Streak: {progress.streak_days} day(s)</p>
    </div>
  );
}
