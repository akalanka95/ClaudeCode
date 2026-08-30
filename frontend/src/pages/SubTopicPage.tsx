import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getNode } from "../api/nodes";
import type { NodeResponse } from "../types/api";
import { ReferenceMaterialsPanel } from "../components/board/ReferenceMaterialsPanel";
import { SyncPanel } from "../components/board/SyncPanel";

export function SubTopicPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const [node, setNode] = useState<NodeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId) return;
    let cancelled = false;
    setLoading(true);
    getNode(nodeId)
      .then((fetched) => {
        if (!cancelled) setNode(fetched);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load this subtopic.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nodeId]);

  if (loading) {
    return <div className="p-4 text-slate-500">Loading...</div>;
  }
  if (error || !nodeId) {
    return <div className="p-4 text-red-600">{error ?? "Subtopic not found."}</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-2">
        <button className="text-sm text-blue-600 hover:underline" onClick={() => navigate(-1)}>
          &larr; Back to board
        </button>
        <h1 className="text-lg font-semibold text-slate-800">{node?.label ?? "Subtopic"}</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center text-slate-400">
            <p className="text-sm">
              This subtopic's dedicated view is still being designed — it'll hold this
              subtopic's own content and nested subtopics in a future phase.
            </p>
          </div>
        </main>
        <SyncPanel nodeId={nodeId} />
        <ReferenceMaterialsPanel nodeId={nodeId} />
      </div>
    </div>
  );
}
