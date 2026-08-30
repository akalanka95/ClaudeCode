export type NodeType = "TOPIC" | "NOTE";

export interface NodeResponse {
  id: string;
  type: NodeType;
  label: string | null;
  noteText: string | null;
  positionX: number;
  positionY: number;
  childBoardId: string | null;
  detailsContent: string | null;
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
