import { apiClient } from "./client";
import type { CreateReferenceMaterialRequest, ReferenceMaterialResponse } from "../types/api";

export async function listReferences(nodeId: string): Promise<ReferenceMaterialResponse[]> {
  const { data } = await apiClient.get<ReferenceMaterialResponse[]>(`/nodes/${nodeId}/references`);
  return data;
}

export async function createReference(
  nodeId: string,
  request: CreateReferenceMaterialRequest,
): Promise<ReferenceMaterialResponse> {
  const { data } = await apiClient.post<ReferenceMaterialResponse>(
    `/nodes/${nodeId}/references`,
    request,
  );
  return data;
}

export async function deleteReference(referenceId: string): Promise<void> {
  await apiClient.delete(`/references/${referenceId}`);
}
