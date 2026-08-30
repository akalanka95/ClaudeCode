import { useMutation } from "@tanstack/react-query";
import * as edgesApi from "../api/edges";
import type { CreateEdgeRequest } from "../types/api";

export function useEdgeMutations(boardId: string) {
  const createEdge = useMutation({
    mutationFn: (request: CreateEdgeRequest) => edgesApi.createEdge(boardId, request),
  });

  const deleteEdge = useMutation({
    mutationFn: (edgeId: string) => edgesApi.deleteEdge(edgeId),
  });

  return { createEdge, deleteEdge };
}
