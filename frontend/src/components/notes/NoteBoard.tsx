import { useRef } from "react";
import { useNoteBlocks } from "../../hooks/useNoteBlocks";
import { useNoteUploads } from "../../hooks/useNoteUploads";
import { NoteBlockCard } from "./NoteBlockCard";
import { LoadingScreen } from "../common/LoadingScreen";

interface NoteBoardProps {
  nodeId: string;
}

const ACCEPTED_FILE_TYPES = "image/png,image/jpeg,application/pdf";

export function NoteBoard({ nodeId }: NoteBoardProps) {
  const { noteBlocksQuery, createNoteBlock, updateNoteBlock, deleteNoteBlock } = useNoteBlocks(nodeId);
  const { activeUploadQuery, uploadNoteFile, isSummarizing } = useNoteUploads(nodeId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noteBlocks = noteBlocksQuery.data ?? [];

  function bringToFront(id: string) {
    const maxZIndex = noteBlocks.reduce((max, block) => Math.max(max, block.zIndex), -1);
    const target = noteBlocks.find((block) => block.id === id);
    if (!target || target.zIndex === maxZIndex) return;
    updateNoteBlock.mutate({ id, request: { zIndex: maxZIndex + 1 } });
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) uploadNoteFile.mutate(file);
  }

  if (noteBlocksQuery.isLoading) {
    return <LoadingScreen label="Loading notes..." fullScreen={false} />;
  }

  return (
    <div className="relative h-full w-full overflow-auto bg-slate-50">
      <div className="absolute right-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-1.5">
        <div className="flex flex-wrap justify-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            className="hidden"
            onChange={handleFileSelected}
          />
          <button
            type="button"
            className="rounded bg-slate-600 px-2.5 py-1 text-xs text-white hover:bg-slate-500 disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSummarizing}
          >
            {isSummarizing ? "Summarizing..." : "Upload notes"}
          </button>
          <button
            type="button"
            className="rounded bg-slate-800 px-2.5 py-1 text-xs text-white hover:bg-slate-700"
            onClick={() => createNoteBlock.mutate({})}
          >
            + Add note
          </button>
        </div>
        {uploadNoteFile.isError && (
          <p className="max-w-xs text-right text-xs text-red-600">
            Failed to upload file. Try again.
          </p>
        )}
        {activeUploadQuery.data?.status === "FAILED" && (
          <p className="max-w-xs text-right text-xs text-red-600">
            {activeUploadQuery.data.errorMessage ?? "Summarizing failed."}
          </p>
        )}
      </div>
      {noteBlocks.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <p className="max-w-sm text-center text-sm text-slate-400">
            No notes yet. Click "+ Add note" to start taking notes for this subtopic.
          </p>
        </div>
      )}
      <div className="isolate h-full w-full">
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
    </div>
  );
}
