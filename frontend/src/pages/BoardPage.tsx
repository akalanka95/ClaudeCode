import { useParams } from "react-router-dom";
import { useBoard } from "../hooks/useBoard";
import { BoardCanvas } from "../components/board/BoardCanvas";
import { Breadcrumbs } from "../components/board/Breadcrumbs";

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
      <header className="border-b border-slate-200 px-4 py-2">
        <Breadcrumbs items={board.breadcrumb} />
      </header>
      <div className="flex-1">
        <BoardCanvas board={board} />
      </div>
    </div>
  );
}
