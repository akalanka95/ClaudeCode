import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getNode } from "../api/nodes";
import type { NodeResponse } from "../types/api";
import { useBoard } from "../hooks/useBoard";
import { AppHeader } from "../components/common/AppHeader";
import { LoadingScreen } from "../components/common/LoadingScreen";
import { SyncReferenceSidebar } from "../components/board/SyncReferenceSidebar";
import { NoteBoard } from "../components/notes/NoteBoard";
import { AskChatGptButton } from "../components/details/AskChatGptButton";

const SYNC_ENABLED = import.meta.env.VITE_ENABLE_SYNC !== "false";

export function SubTopicPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
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

  const { data: board } = useBoard(node?.boardId);
  const breadcrumbItems =
    node && board
      ? [...board.breadcrumb, { nodeId: node.id, label: node.label, boardId: node.boardId }]
      : [];

  if (loading) {
    return <LoadingScreen />;
  }
  if (error || !nodeId || !node) {
    return <div className="p-4 text-red-600">{error ?? "Subtopic not found."}</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      <AppHeader breadcrumbItems={breadcrumbItems} showSearch />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <NoteBoard nodeId={nodeId} />
        </main>
        {SYNC_ENABLED && <SyncReferenceSidebar nodeId={nodeId} />}
      </div>
      <AskChatGptButton />
    </div>
  );
}
