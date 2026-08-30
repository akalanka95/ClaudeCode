import { apiClient } from "./client";
import type { BoardResponse, RootBoardResponse } from "../types/api";

export async function getRootBoard(): Promise<RootBoardResponse> {
  const { data } = await apiClient.get<RootBoardResponse>("/boards/root");
  return data;
}

export async function getBoard(boardId: string): Promise<BoardResponse> {
  const { data } = await apiClient.get<BoardResponse>(`/boards/${boardId}`);
  return data;
}
