import { useState } from "react";
import { useParams } from "react-router-dom";
import { useBoard } from "../hooks/useBoard";
import { BoardCanvas } from "../components/board/BoardCanvas";
import { AppHeader } from "../components/common/AppHeader";
import { LoadingScreen } from "../components/common/LoadingScreen";
import { ReferenceMaterialsPanel } from "../components/board/ReferenceMaterialsPanel";
import { MockInterviewEntryPanel } from "../components/interview/MockInterviewEntryPanel";
import { CollapsibleSidePanel } from "../components/common/CollapsibleSidePanel";

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading, isError } = useBoard(boardId);
  const [referencePanelOpen, setReferencePanelOpen] = useState(false);

  if (isLoading) {
    return <LoadingScreen />;
  }
  if (isError || !board) {
    return <div className="p-4 text-red-600">Failed to load this board.</div>;
  }

  const isHome = !board.parentNode;

  return (
    <div className="flex h-screen flex-col">
      <AppHeader breadcrumbItems={board.breadcrumb} showSearch />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <BoardCanvas key={board.boardId} board={board} />
        </div>
        {board.parentNode && (
          <CollapsibleSidePanel
            label="Reference materials"
            open={referencePanelOpen}
            onOpenChange={setReferencePanelOpen}
          >
            <ReferenceMaterialsPanel
              nodeId={board.parentNode.id}
              description={`Research links for "${board.parentNode.label ?? "this topic"}" — kept here for later reuse.`}
            />
          </CollapsibleSidePanel>
        )}
        {isHome && <MockInterviewEntryPanel />}
      </div>
    </div>
  );
}
