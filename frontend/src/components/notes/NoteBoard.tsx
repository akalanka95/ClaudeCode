import { useNoteBlocks } from "../../hooks/useNoteBlocks";
import { NoteBlockCard } from "./NoteBlockCard";

interface NoteBoardProps {
  nodeId: string;
}

export function NoteBoard({ nodeId }: NoteBoardProps) {
  const { noteBlocksQuery, createNoteBlock, updateNoteBlock, deleteNoteBlock } = useNoteBlocks(nodeId);
  const noteBlocks = noteBlocksQuery.data ?? [];

  function bringToFront(id: string) {
    const maxZIndex = noteBlocks.reduce((max, block) => Math.max(max, block.zIndex), -1);
    const target = noteBlocks.find((block) => block.id === id);
    if (!target || target.zIndex === maxZIndex) return;
    updateNoteBlock.mutate({ id, request: { zIndex: maxZIndex + 1 } });
  }

  if (noteBlocksQuery.isLoading) {
    return <div className="p-4 text-sm text-slate-500">Loading notes...</div>;
  }

  return (
    <div className="relative h-full w-full overflow-auto bg-slate-50">
      <button
        type="button"
        className="absolute right-3 top-3 z-10 rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        onClick={() => createNoteBlock.mutate({})}
      >
        + Add note
      </button>
      {noteBlocks.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <p className="max-w-sm text-center text-sm text-slate-400">
            No notes yet. Click "+ Add note" to start taking notes for this subtopic.
          </p>
        </div>
      )}
      {noteBlocks.map((noteBlock) => (
        <NoteBlockCard
          key={noteBlock.id}
          noteBlock={noteBlock}
          onUpdate={(id, request) => updateNoteBlock.mutate({ id, request })}
          onDelete={(id) => deleteNoteBlock.mutate(id)}
          onBringToFront={bringToFront}
        />
      ))}
    </div>
  );
}
