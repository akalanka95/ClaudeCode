import { apiClient } from "./client";
import type { CreateNoteBlockRequest, NoteBlockResponse, UpdateNoteBlockRequest } from "../types/api";

export async function listNoteBlocks(nodeId: string): Promise<NoteBlockResponse[]> {
  const { data } = await apiClient.get<NoteBlockResponse[]>(`/nodes/${nodeId}/note-blocks`);
  return data;
}

export async function createNoteBlock(
  nodeId: string,
  request: CreateNoteBlockRequest,
): Promise<NoteBlockResponse> {
  const { data } = await apiClient.post<NoteBlockResponse>(`/nodes/${nodeId}/note-blocks`, request);
  return data;
}

export async function updateNoteBlock(
  noteBlockId: string,
  request: UpdateNoteBlockRequest,
): Promise<NoteBlockResponse> {
  const { data } = await apiClient.patch<NoteBlockResponse>(`/note-blocks/${noteBlockId}`, request);
  return data;
}

export async function deleteNoteBlock(noteBlockId: string): Promise<void> {
  await apiClient.delete(`/note-blocks/${noteBlockId}`);
}
