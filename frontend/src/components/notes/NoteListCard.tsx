import { useRef, useState } from "react";
import type { NoteBlockResponse, UpdateNoteBlockRequest } from "../../types/api";
import { NoteEditor } from "./NoteEditor";
import { COLOR_CLASSES, COLOR_ORDER, COLOR_SWATCH_CLASSES } from "./noteColors";

interface NoteListCardProps {
  noteBlock: NoteBlockResponse;
  onUpdate: (id: string, request: UpdateNoteBlockRequest) => void;
  onDelete: (id: string) => void;
}

const SAVE_DEBOUNCE_MS = 600;
const PREVIEW_CLASS =
  "line-clamp-3 text-sm leading-normal text-slate-700 [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:hidden";

export function NoteListCard({ noteBlock, onUpdate, onDelete }: NoteListCardProps) {
  const colorClass = COLOR_CLASSES[noteBlock.color] ?? COLOR_CLASSES.yellow;
  const contentSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A brand-new note has nothing to preview, so start it expanded and ready to type into.
  const [expanded, setExpanded] = useState(() => noteBlock.content.trim().length === 0);

  function cycleColor() {
    const next = COLOR_ORDER[(COLOR_ORDER.indexOf(noteBlock.color) + 1) % COLOR_ORDER.length];
    onUpdate(noteBlock.id, { color: next });
  }

  function handleContentChange(html: string) {
    if (contentSaveTimer.current) clearTimeout(contentSaveTimer.current);
    contentSaveTimer.current = setTimeout(() => {
      onUpdate(noteBlock.id, { content: html });
    }, SAVE_DEBOUNCE_MS);
  }

  return (
    <div className={`flex shrink-0 flex-col overflow-hidden rounded-lg border shadow-sm ${colorClass}`}>
      <div className="flex min-h-11 items-center justify-between gap-1 border-b border-black/10 px-2 py-1.5">
        <button
          type="button"
          title="Change color"
          aria-label="Change color"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-black/10"
          onClick={cycleColor}
        >
          <span
            className={`h-3 w-3 rounded-full border border-black/20 ${COLOR_SWATCH_CLASSES[noteBlock.color] ?? COLOR_SWATCH_CLASSES.yellow}`}
          />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={noteBlock.minimized ? "Maximize" : "Minimize"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm leading-none hover:bg-black/10"
            onClick={() => onUpdate(noteBlock.id, { minimized: !noteBlock.minimized })}
          >
            {noteBlock.minimized ? "□" : "–"}
          </button>
          <button
            type="button"
            title="Delete note"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm leading-none hover:bg-black/10"
            onClick={() => onDelete(noteBlock.id)}
          >
            &times;
          </button>
        </div>
      </div>
      {!noteBlock.minimized && expanded && (
        <div className="min-h-[160px] p-2">
          <NoteEditor content={noteBlock.content} onChange={handleContentChange} dense={false} />
          <button
            type="button"
            className="mt-1 text-xs font-medium text-blue-600 hover:underline"
            onClick={() => setExpanded(false)}
          >
            Show less
          </button>
        </div>
      )}
      {!noteBlock.minimized && !expanded && (
        <div className="p-2">
          <div className={PREVIEW_CLASS} dangerouslySetInnerHTML={{ __html: noteBlock.content }} />
          <button
            type="button"
            className="mt-1 text-xs font-medium text-blue-600 hover:underline"
            onClick={() => setExpanded(true)}
          >
            View more
          </button>
        </div>
      )}
    </div>
  );
}
