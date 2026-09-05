import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopicPicker } from "../components/interview/TopicPicker";
import { useCreateInterviewSession, useInterviewHistory, useTopicOptions } from "../hooks/useInterview";

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 10;
const DEFAULT_QUESTIONS = 5;

export function InterviewSetupPage() {
  const navigate = useNavigate();
  const topicsQuery = useTopicOptions();
  const historyQuery = useInterviewHistory();
  const createSession = useCreateInterviewSession();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTIONS);

  function toggleTopic(nodeId: string) {
    setSelectedIds((prev) => (prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]));
  }

  function handleStart() {
    if (selectedIds.length === 0) return;
    createSession.mutate(
      { topicNodeIds: selectedIds, questionCount },
      { onSuccess: (session) => navigate(`/interview/${session.id}`) },
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4">
      <button
        className="flex min-h-11 items-center self-start text-sm text-blue-600 hover:underline"
        onClick={() => navigate("/")}
      >
        &larr; Back to board
      </button>

      <h1 className="text-xl font-semibold text-slate-800">Mock Interview</h1>
      <p className="text-sm text-slate-500">
        Pick one or more topics from your map. An Interviewer agent will ask questions grounded in
        your notes, a Grader will score each answer, and a Coach will suggest how to improve.
      </p>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Topics</h2>
        <TopicPicker
          topics={topicsQuery.data ?? []}
          selectedIds={selectedIds}
          onToggle={toggleTopic}
          isLoading={topicsQuery.isLoading}
        />
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="question-count" className="text-sm text-slate-700">
          Number of questions
        </label>
        <input
          id="question-count"
          type="number"
          min={MIN_QUESTIONS}
          max={MAX_QUESTIONS}
          value={questionCount}
          onChange={(e) =>
            setQuestionCount(Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Number(e.target.value))))
          }
          className="w-20 rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      {createSession.isError && (
        <div className="text-sm text-red-600">Failed to start the interview. Try again.</div>
      )}

      <button
        type="button"
        className="min-h-11 w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 sm:w-auto"
        onClick={handleStart}
        disabled={selectedIds.length === 0 || createSession.isPending}
      >
        {createSession.isPending ? "Starting..." : "Start interview"}
      </button>

      {historyQuery.data && historyQuery.data.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Past sessions</h2>
          <div className="flex flex-col divide-y divide-slate-100 rounded border border-slate-200">
            {historyQuery.data.map((session) => (
              <button
                key={session.id}
                onClick={() => navigate(`/interview/${session.id}`)}
                className="flex min-h-11 items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="truncate text-sm text-slate-700">
                  {session.topics.map((t) => t.label ?? "Untitled").join(", ")}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {session.status === "COMPLETED" && session.overallScore !== null
                    ? `${session.overallScore.toFixed(1)}/10`
                    : "In progress"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
