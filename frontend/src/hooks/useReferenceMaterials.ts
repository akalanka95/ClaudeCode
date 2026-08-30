import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as referencesApi from "../api/references";
import type { CreateReferenceMaterialRequest } from "../types/api";

export function useReferenceMaterials(nodeId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["references", nodeId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const referencesQuery = useQuery({
    queryKey,
    queryFn: () => referencesApi.listReferences(nodeId as string),
    enabled: Boolean(nodeId),
  });

  const createReference = useMutation({
    mutationFn: (request: CreateReferenceMaterialRequest) =>
      referencesApi.createReference(nodeId as string, request),
    onSuccess: invalidate,
  });

  const deleteReference = useMutation({
    mutationFn: (referenceId: string) => referencesApi.deleteReference(referenceId),
    onSuccess: invalidate,
  });

  return { referencesQuery, createReference, deleteReference };
}
