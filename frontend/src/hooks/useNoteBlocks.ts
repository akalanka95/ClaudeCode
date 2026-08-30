import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as noteBlocksApi from "../api/noteBlocks";
import type { CreateNoteBlockRequest, NoteBlockResponse, UpdateNoteBlockRequest } from "../types/api";

export function useNoteBlocks(nodeId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["note-blocks", nodeId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const noteBlocksQuery = useQuery({
    queryKey,
    queryFn: () => noteBlocksApi.listNoteBlocks(nodeId as string),
    enabled: Boolean(nodeId),
  });

  const createNoteBlock = useMutation({
    mutationFn: (request: CreateNoteBlockRequest) =>
      noteBlocksApi.createNoteBlock(nodeId as string, request),
    onSuccess: invalidate,
  });

  const updateNoteBlock = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateNoteBlockRequest }) =>
      noteBlocksApi.updateNoteBlock(id, request),
    onSuccess: (updated) => {
      queryClient.setQueryData<NoteBlockResponse[]>(queryKey, (current) =>
        current?.map((block) => (block.id === updated.id ? updated : block)),
      );
    },
  });

  const deleteNoteBlock = useMutation({
    mutationFn: (noteBlockId: string) => noteBlocksApi.deleteNoteBlock(noteBlockId),
    onSuccess: invalidate,
  });

  return { noteBlocksQuery, createNoteBlock, updateNoteBlock, deleteNoteBlock };
}
