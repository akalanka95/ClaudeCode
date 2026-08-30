import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as noteUploadsApi from "../api/noteUploads";
import type { NoteUploadStatus } from "../types/api";

const IN_PROGRESS_STATUSES: NoteUploadStatus[] = ["PENDING", "RUNNING"];
const POLL_INTERVAL_MS = 2000;

export function useNoteUploads(nodeId: string | undefined) {
  const queryClient = useQueryClient();
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  const activeUploadQuery = useQuery({
    queryKey: ["note-upload", nodeId, activeUploadId],
    queryFn: () => noteUploadsApi.getNoteUpload(nodeId as string, activeUploadId as string),
    enabled: Boolean(nodeId && activeUploadId),
    refetchInterval: (query) =>
      query.state.data && IN_PROGRESS_STATUSES.includes(query.state.data.status)
        ? POLL_INTERVAL_MS
        : false,
  });

  const activeStatus = activeUploadQuery.data?.status;
  useEffect(() => {
    if (activeStatus === "COMPLETED") {
      queryClient.invalidateQueries({ queryKey: ["note-blocks", nodeId] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  const uploadNoteFile = useMutation({
    mutationFn: (file: File) => noteUploadsApi.uploadNoteFile(nodeId as string, file),
    onSuccess: (upload) => setActiveUploadId(upload.id),
  });

  const isSummarizing =
    uploadNoteFile.isPending || (activeStatus ? IN_PROGRESS_STATUSES.includes(activeStatus) : false);

  return { activeUploadQuery, uploadNoteFile, isSummarizing };
}
