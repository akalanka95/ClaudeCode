interface FeedbackPanelProps {
  phase: "idle" | "grading" | "coaching" | "question" | "complete";
  score: number | null;
  gradingText: string;
  coachingText: string;
}

export function FeedbackPanel({ phase, score, gradingText, coachingText }: FeedbackPanelProps) {
  if (phase === "idle" && !gradingText && !coachingText) {
    return null;
  }

  const showGrading = gradingText.length > 0 || phase === "grading";
  const showCoaching = coachingText.length > 0 || phase === "coaching";

  return (
    <div className="flex flex-col gap-3">
      {showGrading && (
        <div className="rounded border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Grader</span>
            {score !== null && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {score}/10
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-slate-700">
            {gradingText}
            {phase === "grading" && <span className="ml-0.5 animate-pulse">&#9615;</span>}
          </p>
        </div>
      )}

      {showCoaching && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Coach</span>
          <p className="mt-1.5 text-sm text-emerald-900">
            {coachingText}
            {phase === "coaching" && <span className="ml-0.5 animate-pulse">&#9615;</span>}
          </p>
        </div>
      )}
    </div>
  );
}
