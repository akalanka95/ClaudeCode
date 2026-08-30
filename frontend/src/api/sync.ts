import { apiClient } from "./client";
import type { SyncRunResponse } from "../types/api";

export async function triggerSync(nodeId: string): Promise<SyncRunResponse> {
  const { data } = await apiClient.post<SyncRunResponse>(`/nodes/${nodeId}/sync-runs`);
  return data;
}

export async function getSyncRun(nodeId: string, runId: string): Promise<SyncRunResponse> {
  const { data } = await apiClient.get<SyncRunResponse>(`/nodes/${nodeId}/sync-runs/${runId}`);
  return data;
}

export async function getSyncHistory(nodeId: string): Promise<SyncRunResponse[]> {
  const { data } = await apiClient.get<SyncRunResponse[]>(`/nodes/${nodeId}/sync-runs`);
  return data;
}
