import { useSubtopicSync } from "../../hooks/useSubtopicSync";
import type { SyncRunResponse, SyncRunStatus } from "../../types/api";

interface SyncPanelProps {
  nodeId: string;
}

const STATUS_LABEL: Record<SyncRunStatus, string> = {
  PENDING: "Queued...",
  RUNNING: "Searching...",
  COMPLETED: "Updated",
  NO_NEW_UPDATES: "No new updates",
  FAILED: "Sync failed",
};

export function SyncPanel({ nodeId }: SyncPanelProps) {
  const { historyQuery, activeRunQuery, triggerSync, isSyncing } = useSubtopicSync(nodeId);

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-1 flex-col gap-3 overflow-y-auto border-l border-slate-200 p-4 sm:w-80">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Sync</h2>
        <button
          className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-500 disabled:opacity-50"
          onClick={() => triggerSync.mutate()}
          disabled={isSyncing}
        >
          {isSyncing ? "Syncing..." : "Sync"}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Fetches recent developments related to this topic and summarizes them below.
      </p>

      {activeRunQuery.data && (
        <div className="rounded border border-slate-200 p-2 text-xs text-slate-500">
          {STATUS_LABEL[activeRunQuery.data.status]}
        </div>
      )}
      {triggerSync.isError && (
        <div className="text-xs text-red-600">Failed to start sync. Try again.</div>
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">History</h3>
        {historyQuery.isLoading && <div className="text-sm text-slate-500">Loading...</div>}
        {historyQuery.isError && (
          <div className="text-sm text-red-600">Failed to load sync history.</div>
        )}
        {historyQuery.data?.length === 0 && (
          <div className="text-sm text-slate-400">No syncs yet.</div>
        )}
        {historyQuery.data?.map((run) => <SyncHistoryEntry key={run.id} run={run} />)}
      </div>
    </aside>
  );
}

function SyncHistoryEntry({ run }: { run: SyncRunResponse }) {
  const timestamp = new Date(run.createdAt).toLocaleString();

  return (
    <div className="rounded border border-slate-200 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">{STATUS_LABEL[run.status]}</span>
        <span className="text-xs text-slate-400">{timestamp}</span>
      </div>

      {run.status === "COMPLETED" && (
        <>
          {run.summary && <p className="mt-1 text-sm text-slate-700">{run.summary}</p>}
          <div className="mt-2 flex flex-col gap-1.5">
            {run.links?.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="break-words text-sm font-medium text-blue-600 hover:underline">
                  {link.title || link.url}
                </div>
                {link.note && <p className="text-xs text-slate-500">{link.note}</p>}
              </a>
            ))}
          </div>
        </>
      )}

      {run.status === "FAILED" && run.errorMessage && (
        <p className="mt-1 text-sm text-red-600">{run.errorMessage}</p>
      )}
    </div>
  );
}
