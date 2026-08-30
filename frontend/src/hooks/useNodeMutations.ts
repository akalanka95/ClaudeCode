import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as nodesApi from "../api/nodes";
import type {
  CreateNodeRequest,
  PositionUpdate,
  UpdateDetailsRequest,
  UpdateNodeRequest,
} from "../types/api";

export function useNodeMutations(boardId: string) {
  const queryClient = useQueryClient();
  const invalidateBoard = () => queryClient.invalidateQueries({ queryKey: ["board", boardId] });

  const createNode = useMutation({
    mutationFn: (request: CreateNodeRequest) => nodesApi.createNode(boardId, request),
  });

  const updateNode = useMutation({
    mutationFn: ({ nodeId, request }: { nodeId: string; request: UpdateNodeRequest }) =>
      nodesApi.updateNode(nodeId, request),
  });

  const updateDetails = useMutation({
    mutationFn: ({ nodeId, request }: { nodeId: string; request: UpdateDetailsRequest }) =>
      nodesApi.updateNodeDetails(nodeId, request),
  });

  const updatePositions = useMutation({
    mutationFn: (positions: PositionUpdate[]) => nodesApi.updateNodePositions(boardId, positions),
  });

  const deleteNode = useMutation({
    mutationFn: (nodeId: string) => nodesApi.deleteNode(nodeId),
    onSuccess: invalidateBoard,
  });

  return { createNode, updateNode, updateDetails, updatePositions, deleteNode };
}
