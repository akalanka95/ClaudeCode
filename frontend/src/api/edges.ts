import { apiClient } from "./client";
import type { CreateEdgeRequest, EdgeResponse } from "../types/api";

export async function createEdge(
  boardId: string,
  request: CreateEdgeRequest,
): Promise<EdgeResponse> {
  const { data } = await apiClient.post<EdgeResponse>(`/boards/${boardId}/edges`, request);
  return data;
}

export async function deleteEdge(edgeId: string): Promise<void> {
  await apiClient.delete(`/edges/${edgeId}`);
}
