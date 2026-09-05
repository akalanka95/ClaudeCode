import { useNavigate, useParams } from "react-router-dom";
import { AnswerInput } from "../components/interview/AnswerInput";
import { FeedbackPanel } from "../components/interview/FeedbackPanel";
import { QuestionCard } from "../components/interview/QuestionCard";
import { useInterviewSession } from "../hooks/useInterview";

export function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    session,
    currentTurn,
    reviewingTurn,
    phase,
    gradingText,
    coachingText,
    questionText,
    submitting,
    error,
    submitAnswer,
    isLoading,
    isError,
  } = useInterviewSession(sessionId);

  if (isLoading) {
    return <div className="p-4 text-slate-500">Loading...</div>;
  }
  if (isError || !session) {
    return <div className="p-4 text-red-600">Failed to load this interview session.</div>;
  }

  const isGeneratingNextQuestion = phase === "question";
  const isAnswering = phase === "idle" && currentTurn?.status === "PENDING_ANSWER";

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4">
      <button
        className="flex min-h-11 items-center self-start text-sm text-blue-600 hover:underline"
        onClick={() => navigate("/interview")}
      >
        &larr; Back to setup
      </button>

      <h1 className="text-xl font-semibold text-slate-800">
        Mock Interview — {session.topics.map((t) => t.label ?? "Untitled").join(", ")}
      </h1>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {session.status === "COMPLETED" ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-700">Session complete</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">
            {session.overallScore !== null ? `${session.overallScore.toFixed(1)}/10` : "—"}
          </div>
        </div>
      ) : isGeneratingNextQuestion ? (
        <QuestionCard
          turnIndex={(currentTurn?.turnIndex ?? -1) + 1}
          totalQuestions={session.totalQuestions}
          question={questionText}
          isStreaming
        />
      ) : (
        currentTurn && (
          <QuestionCard
            turnIndex={currentTurn.turnIndex}
            totalQuestions={session.totalQuestions}
            question={currentTurn.question}
            isStreaming={false}
          />
        )
      )}

      {isAnswering && <AnswerInput disabled={submitting} submitting={submitting} onSubmit={submitAnswer} />}

      {reviewingTurn && (
        <FeedbackPanel
          phase={phase}
          score={reviewingTurn.score}
          gradingText={gradingText || reviewingTurn.graderFeedback || ""}
          coachingText={coachingText || reviewingTurn.coachFeedback || ""}
        />
      )}
    </div>
  );
}
