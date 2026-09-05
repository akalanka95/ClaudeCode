import { useState } from "react";
import { useParams } from "react-router-dom";
import { useBoard } from "../hooks/useBoard";
import { BoardCanvas } from "../components/board/BoardCanvas";
import { Breadcrumbs } from "../components/board/Breadcrumbs";
import { ReferenceMaterialsPanel } from "../components/board/ReferenceMaterialsPanel";

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading, isError } = useBoard(boardId);
  const [referencePanelOpen, setReferencePanelOpen] = useState(false);

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
          <>
            {!referencePanelOpen && (
              <button
                type="button"
                className="flex min-h-11 shrink-0 items-center gap-1 border-l border-slate-200 px-2 text-sm text-slate-600 hover:bg-slate-50 sm:hidden"
                onClick={() => setReferencePanelOpen(true)}
              >
                <span className="[writing-mode:vertical-rl]">Reference materials</span>
                <span aria-hidden>‹</span>
              </button>
            )}
            <div
              className={`${
                referencePanelOpen ? "fixed inset-0 z-40 flex flex-col bg-white" : "hidden"
              } sm:static sm:z-auto sm:flex sm:h-full sm:w-auto sm:shrink-0`}
            >
              <button
                type="button"
                className="flex min-h-11 items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:hidden"
                onClick={() => setReferencePanelOpen(false)}
              >
                Reference materials
                <span aria-hidden>›</span>
              </button>
              <ReferenceMaterialsPanel
                nodeId={board.parentNode.id}
                description={`Research links for "${board.parentNode.label ?? "this topic"}" — kept here for later reuse.`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
