import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (accuracy / 100) * circumference;
  return (
    <Card className="mx-auto grid max-w-5xl gap-8 bg-[#F0EEE9] p-8 md:grid-cols-2">
      <div className="space-y-3">
        <h2 className="font-serif text-4xl text-[#061B0E]">Session Summary</h2>
        <p className="text-sm leading-relaxed text-[#434843]">
          You&apos;re making incredible progress today. Focusing on ancestral terms helps strengthen the community&apos;s oral legacy.
        </p>
        <div className="pt-2 text-sm text-[#434843]">
          <p>Cards seen: {seen}</p>
          <p>Correct: {correct}</p>
          <p>Duration: {durationSeconds}s</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={onRestart}>Start Again</Button>
          <Button variant="outline">Back to Dictionary</Button>
        </div>
      </div>
      <div className="relative grid place-content-center">
        <svg width="160" height="160" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="40" stroke="#E4E2DD" strokeWidth="10" fill="none" />
          <circle
            cx="64"
            cy="64"
            r="40"
            stroke="#819986"
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 64 64)"
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <p className="font-serif text-3xl text-[#061B0E]">{accuracy}%</p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#434843]">Score</p>
        </div>
      </div>
    </Card>
  );
}
