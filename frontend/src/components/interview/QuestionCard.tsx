interface QuestionCardProps {
  turnIndex: number;
  totalQuestions: number;
  question: string;
  isStreaming: boolean;
}

export function QuestionCard({ turnIndex, totalQuestions, question, isStreaming }: QuestionCardProps) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Question {turnIndex + 1} of {totalQuestions}
      </div>
      <p className="mt-1.5 text-base text-slate-800">
        {question || (isStreaming ? "Thinking of a question..." : "")}
        {isStreaming && <span className="ml-0.5 animate-pulse">&#9615;</span>}
      </p>
    </div>
  );
}
