import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as interviewApi from "../api/interview";
import * as nodesApi from "../api/nodes";
import type { InterviewSessionResponse, InterviewTurnResponse } from "../types/api";

export function useTopicOptions() {
  return useQuery({ queryKey: ["topic-options"], queryFn: nodesApi.listTopics });
}

export function useCreateInterviewSession() {
  return useMutation({ mutationFn: interviewApi.createSession });
}

export function useInterviewHistory() {
  return useQuery({ queryKey: ["interview-sessions"], queryFn: interviewApi.listSessions });
}

export type InterviewPhase = "idle" | "grading" | "coaching" | "question" | "complete";

export function useInterviewSession(sessionId: string | undefined) {
  const [session, setSession] = useState<InterviewSessionResponse | null>(null);
  const [phase, setPhase] = useState<InterviewPhase>("idle");
  const [gradingText, setGradingText] = useState("");
  const [coachingText, setCoachingText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewingTurnIndex, setReviewingTurnIndex] = useState<number | null>(null);

  const sessionQuery = useQuery({
    queryKey: ["interview-session", sessionId],
    queryFn: () => interviewApi.getSession(sessionId as string),
    enabled: Boolean(sessionId),
  });

  useEffect(() => {
    if (sessionQuery.data) {
      setSession(sessionQuery.data);
      setPhase(sessionQuery.data.status === "COMPLETED" ? "complete" : "idle");
    }
  }, [sessionQuery.data]);

  const currentTurn = session?.turns.find((turn) => turn.turnIndex === session.currentTurnIndex) ?? null;

  function patchTurn(updated: InterviewTurnResponse) {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            turns: prev.turns.some((t) => t.turnIndex === updated.turnIndex)
              ? prev.turns.map((t) => (t.turnIndex === updated.turnIndex ? updated : t))
              : [...prev.turns, updated],
          }
        : prev,
    );
  }

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!session || !currentTurn) return;
      setSubmitting(true);
      setError(null);
      setGradingText("");
      setCoachingText("");
      setQuestionText("");
      setReviewingTurnIndex(currentTurn.turnIndex);
      setPhase("grading");

      await interviewApi.submitAnswer(session.id, currentTurn.turnIndex, answer, {
        onGrading: (chunk) => setGradingText((prev) => prev + chunk),
        onTurnGraded: (turn) => {
          patchTurn(turn);
          setPhase("coaching");
        },
        onCoaching: (chunk) => setCoachingText((prev) => prev + chunk),
        onTurnCoached: (turn) => {
          patchTurn(turn);
          setPhase("question");
        },
        onQuestionChunk: (chunk) => setQuestionText((prev) => prev + chunk),
        onNextQuestion: (turn) => {
          patchTurn(turn);
          setSession((prev) => (prev ? { ...prev, currentTurnIndex: turn.turnIndex } : prev));
          setPhase("idle");
        },
        onSessionComplete: (updatedSession) => {
          setSession(updatedSession);
          setPhase("complete");
        },
        onError: (message) => setError(message),
      });

      setSubmitting(false);
    },
    [session, currentTurn],
  );

  const reviewingTurn =
    reviewingTurnIndex === null
      ? null
      : (session?.turns.find((turn) => turn.turnIndex === reviewingTurnIndex) ?? null);

  return {
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
    isLoading: sessionQuery.isLoading,
    isError: sessionQuery.isError,
  };
}
