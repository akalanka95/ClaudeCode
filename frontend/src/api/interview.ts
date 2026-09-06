import { apiClient } from "./client";
import { getStoredToken } from "./authToken";
import type {
  CreateInterviewSessionRequest,
  InterviewSessionResponse,
  InterviewTurnResponse,
} from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

export async function createSession(
  request: CreateInterviewSessionRequest,
): Promise<InterviewSessionResponse> {
  const { data } = await apiClient.post<InterviewSessionResponse>("/interview/sessions", request);
  return data;
}

export async function getSession(sessionId: string): Promise<InterviewSessionResponse> {
  const { data } = await apiClient.get<InterviewSessionResponse>(`/interview/sessions/${sessionId}`);
  return data;
}

export async function listSessions(): Promise<InterviewSessionResponse[]> {
  const { data } = await apiClient.get<InterviewSessionResponse[]>("/interview/sessions");
  return data;
}

export interface InterviewStreamHandlers {
  onGrading?: (chunk: string) => void;
  onTurnGraded?: (turn: InterviewTurnResponse) => void;
  onCoaching?: (chunk: string) => void;
  onTurnCoached?: (turn: InterviewTurnResponse) => void;
  onQuestionChunk?: (chunk: string) => void;
  onNextQuestion?: (turn: InterviewTurnResponse) => void;
  onSessionComplete?: (session: InterviewSessionResponse) => void;
  onError?: (message: string) => void;
}

// EventSource can't send a POST body, so this turn's streamed response is read by hand: fetch a
// text/event-stream response and parse SSE frames (blank-line-delimited "event:"/"data:" blocks)
// out of the raw byte stream as they arrive.
export async function submitAnswer(
  sessionId: string,
  turnIndex: number,
  answer: string,
  handlers: InterviewStreamHandlers,
): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(
    `${API_BASE_URL}/interview/sessions/${sessionId}/turns/${turnIndex}/answer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ answer }),
    },
  );

  if (!response.ok || !response.body) {
    handlers.onError?.("Failed to submit answer.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let frameEnd = buffer.indexOf("\n\n");
    while (frameEnd !== -1) {
      dispatchFrame(buffer.slice(0, frameEnd), handlers);
      buffer = buffer.slice(frameEnd + 2);
      frameEnd = buffer.indexOf("\n\n");
    }
  }
}

function dispatchFrame(frame: string, handlers: InterviewStreamHandlers) {
  let eventName = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  const data = dataLines.join("\n");
  if (data === "") return;

  switch (eventName) {
    // These four carry the raw streamed text chunk (Spring writes a plain String as-is, not
    // JSON-encoded) — pass through directly, no parsing.
    case "grading":
      handlers.onGrading?.(data);
      break;
    case "coaching":
      handlers.onCoaching?.(data);
      break;
    case "question-chunk":
      handlers.onQuestionChunk?.(data);
      break;
    case "error":
      handlers.onError?.(data);
      break;
    // These carry a full JSON-serialized DTO.
    case "turn-graded":
      handlers.onTurnGraded?.(JSON.parse(data));
      break;
    case "turn-coached":
      handlers.onTurnCoached?.(JSON.parse(data));
      break;
    case "next-question":
      handlers.onNextQuestion?.(JSON.parse(data));
      break;
    case "session-complete":
      handlers.onSessionComplete?.(JSON.parse(data));
      break;
    default:
      break;
  }
}
