import { apiClient } from "./client";
import type { SearchResponse } from "../types/api";

export async function search(query: string, limit = 20): Promise<SearchResponse> {
  const { data } = await apiClient.get<SearchResponse>("/search", {
    params: { q: query, limit },
  });
  return data;
}
