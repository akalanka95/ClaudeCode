import { apiClient } from "./client";
import type { NoteUploadResponse } from "../types/api";

export async function uploadNoteFile(nodeId: string, file: File): Promise<NoteUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<NoteUploadResponse>(`/nodes/${nodeId}/note-uploads`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getNoteUpload(nodeId: string, uploadId: string): Promise<NoteUploadResponse> {
  const { data } = await apiClient.get<NoteUploadResponse>(`/nodes/${nodeId}/note-uploads/${uploadId}`);
  return data;
}
