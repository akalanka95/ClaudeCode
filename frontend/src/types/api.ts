export type NodeType = "TOPIC" | "NOTE";

export interface NodeResponse {
  id: string;
  boardId: string;
  type: NodeType;
  label: string | null;
  noteText: string | null;
  positionX: number;
  positionY: number;
  childBoardId: string | null;
  detailsContent: string | null;
  width: number | null;
  height: number | null;
  completed: boolean;
  subtopicCount: number | null;
  completedSubtopicCount: number | null;
}

export interface EdgeResponse {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface BreadcrumbItem {
  nodeId: string;
  label: string | null;
  boardId: string;
}

export interface ParentNodeInfo {
  id: string;
  label: string | null;
  detailsContent: string | null;
}

export interface BoardResponse {
  boardId: string;
  parentNode: ParentNodeInfo | null;
  breadcrumb: BreadcrumbItem[];
  nodes: NodeResponse[];
  edges: EdgeResponse[];
}

export interface RootBoardResponse {
  boardId: string;
}

export interface CreateNodeRequest {
  type: NodeType;
  label?: string | null;
  noteText?: string | null;
  positionX: number;
  positionY: number;
}

export interface UpdateNodeRequest {
  label?: string;
  noteText?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  completed?: boolean;
}

export interface UpdateDetailsRequest {
  detailsContent: string;
}

export interface PositionUpdate {
  nodeId: string;
  positionX: number;
  positionY: number;
}

export interface CreateEdgeRequest {
  sourceNodeId: string;
  targetNodeId: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
}

export interface ReferenceMaterialResponse {
  id: string;
  nodeId: string;
  url: string;
  title: string | null;
  previewTitle: string | null;
  previewDescription: string | null;
  previewImageUrl: string | null;
  createdAt: string;
}

export interface CreateReferenceMaterialRequest {
  url: string;
  title?: string | null;
}

export type SyncRunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "NO_NEW_UPDATES" | "FAILED";

export interface SyncLink {
  title: string | null;
  url: string;
  note: string | null;
}

export interface SyncRunResponse {
  id: string;
  nodeId: string;
  status: SyncRunStatus;
  summary: string | null;
  links: SyncLink[] | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface NoteBlockResponse {
  id: string;
  nodeId: string;
  content: string;
  color: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  minimized: boolean;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteBlockRequest {
  color?: string;
  positionX?: number;
  positionY?: number;
}

export type NoteUploadStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface NoteUploadResponse {
  id: string;
  nodeId: string;
  status: NoteUploadStatus;
  fileName: string;
  resultNoteBlockId: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface UpdateNoteBlockRequest {
  content?: string;
  color?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  minimized?: boolean;
  zIndex?: number;
}

export interface SearchResultResponse {
  nodeId: string;
  type: NodeType;
  label: string | null;
  boardId: string;
  snippet: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResultResponse[];
}

export interface TopicOptionResponse {
  nodeId: string;
  label: string | null;
  boardId: string;
  path: string[];
}

export type InterviewSessionStatus = "IN_PROGRESS" | "COMPLETED";
export type InterviewTurnStatus = "PENDING_ANSWER" | "GRADED";

export interface InterviewTopicSnapshot {
  nodeId: string;
  label: string | null;
  path: string[];
}

export interface InterviewTurnResponse {
  id: string;
  turnIndex: number;
  question: string;
  answer: string | null;
  score: number | null;
  graderFeedback: string | null;
  coachFeedback: string | null;
  status: InterviewTurnStatus;
}

export interface InterviewSessionResponse {
  id: string;
  topics: InterviewTopicSnapshot[];
  status: InterviewSessionStatus;
  totalQuestions: number;
  currentTurnIndex: number;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
  turns: InterviewTurnResponse[];
}

export interface CreateInterviewSessionRequest {
  topicNodeIds: string[];
  questionCount?: number;
}

export interface SubmitAnswerRequest {
  answer: string;
}

export type AuthProvider = "LOCAL" | "GOOGLE";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CurrentUserResponse {
  id: string;
  username: string | null;
  email: string | null;
  displayName: string | null;
  authProvider: AuthProvider;
}

export interface AuthResponse {
  token: string;
  user: CurrentUserResponse;
}
