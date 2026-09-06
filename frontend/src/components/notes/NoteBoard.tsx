import { useRef } from "react";
import { useNoteBlocks } from "../../hooks/useNoteBlocks";
import { useNoteUploads } from "../../hooks/useNoteUploads";
import { NoteBlockCard } from "./NoteBlockCard";
import { NoteListCard } from "./NoteListCard";
import { LoadingScreen } from "../common/LoadingScreen";

interface NoteBoardProps {
  nodeId: string;
}

const ACCEPTED_FILE_TYPES = "image/png,image/jpeg,application/pdf";
const EMPTY_STATE_MESSAGE = 'No notes yet. Click "+ Add note" to start taking notes for this subtopic.';

export function NoteBoard({ nodeId }: NoteBoardProps) {
  const { noteBlocksQuery, createNoteBlock, updateNoteBlock, deleteNoteBlock } = useNoteBlocks(nodeId);
  const { activeUploadQuery, uploadNoteFile, isSummarizing } = useNoteUploads(nodeId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noteBlocks = noteBlocksQuery.data ?? [];
  const notesByCreatedAt = [...noteBlocks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

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

  const uploadErrorMessage =
    (uploadNoteFile.isError && "Failed to upload file. Try again.") ||
    (activeUploadQuery.data?.status === "FAILED" && (activeUploadQuery.data.errorMessage ?? "Summarizing failed."));

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Mobile (<sm): a normal scrollable list, read top-to-bottom in creation order —
          no drag/pan needed to find a note. */}
      <div className="flex h-full w-full flex-col overflow-y-auto bg-slate-50 sm:hidden">
        <div className="sticky top-0 z-10 flex shrink-0 flex-col gap-1.5 border-b border-slate-200 bg-slate-50 p-2.5">
          <div className="flex flex-wrap gap-2">
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
          {uploadErrorMessage && <p className="text-xs text-red-600">{uploadErrorMessage}</p>}
        </div>
        {notesByCreatedAt.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-4">
            <p className="max-w-sm text-center text-sm text-slate-400">{EMPTY_STATE_MESSAGE}</p>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col gap-3 p-3">
            {notesByCreatedAt.map((noteBlock) => (
              <NoteListCard
                key={noteBlock.id}
                noteBlock={noteBlock}
                onUpdate={(id, request) => updateNoteBlock.mutate({ id, request })}
                onDelete={(id) => deleteNoteBlock.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop (sm+): the original free-drag corkboard. */}
      <div className="relative hidden h-full w-full overflow-auto bg-slate-50 sm:block">
        <div className="absolute right-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-1.5">
          <div className="flex flex-wrap justify-end gap-2">
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
          {uploadErrorMessage && (
            <p className="max-w-xs text-right text-xs text-red-600">{uploadErrorMessage}</p>
          )}
        </div>
        {noteBlocks.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-sm text-center text-sm text-slate-400">{EMPTY_STATE_MESSAGE}</p>
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
    </>
  );
}
