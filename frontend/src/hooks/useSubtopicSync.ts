import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as syncApi from "../api/sync";
import type { SyncRunStatus } from "../types/api";

const IN_PROGRESS_STATUSES: SyncRunStatus[] = ["PENDING", "RUNNING"];
const POLL_INTERVAL_MS = 2000;

export function useSubtopicSync(nodeId: string | undefined) {
  const queryClient = useQueryClient();
  const historyKey = ["sync-runs", nodeId];
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: historyKey,
    queryFn: () => syncApi.getSyncHistory(nodeId as string),
    enabled: Boolean(nodeId),
  });

  const activeRunQuery = useQuery({
    queryKey: ["sync-run", nodeId, activeRunId],
    queryFn: () => syncApi.getSyncRun(nodeId as string, activeRunId as string),
    enabled: Boolean(nodeId && activeRunId),
    refetchInterval: (query) =>
      query.state.data && IN_PROGRESS_STATUSES.includes(query.state.data.status)
        ? POLL_INTERVAL_MS
        : false,
  });

  const activeStatus = activeRunQuery.data?.status;
  useEffect(() => {
    if (activeStatus && !IN_PROGRESS_STATUSES.includes(activeStatus)) {
      queryClient.invalidateQueries({ queryKey: historyKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  const triggerSync = useMutation({
    mutationFn: () => syncApi.triggerSync(nodeId as string),
    onSuccess: (run) => setActiveRunId(run.id),
  });

  const isSyncing = triggerSync.isPending || (activeStatus ? IN_PROGRESS_STATUSES.includes(activeStatus) : false);

  return { historyQuery, activeRunQuery, triggerSync, isSyncing };
}
