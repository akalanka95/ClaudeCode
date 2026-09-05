import { apiClient } from "./client";
import type {
  CreateNodeRequest,
  NodeResponse,
  PositionUpdate,
  TopicOptionResponse,
  UpdateDetailsRequest,
  UpdateNodeRequest,
} from "../types/api";

export async function getNode(nodeId: string): Promise<NodeResponse> {
  const { data } = await apiClient.get<NodeResponse>(`/nodes/${nodeId}`);
  return data;
}

export async function listTopics(): Promise<TopicOptionResponse[]> {
  const { data } = await apiClient.get<TopicOptionResponse[]>("/nodes/topics");
  return data;
}

export async function createNode(
  boardId: string,
  request: CreateNodeRequest,
): Promise<NodeResponse> {
  const { data } = await apiClient.post<NodeResponse>(`/boards/${boardId}/nodes`, request);
  return data;
}

export async function updateNode(
  nodeId: string,
  request: UpdateNodeRequest,
): Promise<NodeResponse> {
  const { data } = await apiClient.patch<NodeResponse>(`/nodes/${nodeId}`, request);
  return data;
}

export async function updateNodeDetails(
  nodeId: string,
  request: UpdateDetailsRequest,
): Promise<NodeResponse> {
  const { data } = await apiClient.patch<NodeResponse>(`/nodes/${nodeId}/details`, request);
  return data;
}

export async function updateNodePositions(
  boardId: string,
  positions: PositionUpdate[],
): Promise<void> {
  await apiClient.patch(`/boards/${boardId}/nodes/positions`, { positions });
}

export async function deleteNode(nodeId: string): Promise<void> {
  await apiClient.delete(`/nodes/${nodeId}`);
}
