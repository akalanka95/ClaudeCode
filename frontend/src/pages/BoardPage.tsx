import { useParams } from "react-router-dom";
import { useBoard } from "../hooks/useBoard";
import { BoardCanvas } from "../components/board/BoardCanvas";
import { Breadcrumbs } from "../components/board/Breadcrumbs";
import { ReferenceMaterialsPanel } from "../components/board/ReferenceMaterialsPanel";

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading, isError } = useBoard(boardId);

  if (isLoading) {
    return <div className="p-4 text-slate-500">Loading...</div>;
  }
  if (isError || !board) {
    return <div className="p-4 text-red-600">Failed to load this board.</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <Breadcrumbs items={board.breadcrumb} />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <BoardCanvas key={board.boardId} board={board} />
        </div>
        {board.parentNode && (
          <ReferenceMaterialsPanel
            nodeId={board.parentNode.id}
            description={`Research links for "${board.parentNode.label ?? "this topic"}" — kept here for later reuse.`}
          />
        )}
      </div>
    </div>
  );
}
