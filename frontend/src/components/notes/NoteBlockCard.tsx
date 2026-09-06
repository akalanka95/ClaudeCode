import { useRef, useState } from "react";
import { Rnd } from "react-rnd";
import type { NoteBlockResponse, UpdateNoteBlockRequest } from "../../types/api";
import { NoteEditor } from "./NoteEditor";
import { COLOR_CLASSES, COLOR_ORDER, COLOR_SWATCH_CLASSES } from "./noteColors";

interface NoteBlockCardProps {
  noteBlock: NoteBlockResponse;
  onUpdate: (id: string, request: UpdateNoteBlockRequest) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
}

const MINIMIZED_HEIGHT = 36;
const SAVE_DEBOUNCE_MS = 600;
const VIEWPORT_MARGIN = 16;

function clampToViewport(noteBlock: NoteBlockResponse) {
  if (typeof window === "undefined") {
    return {
      position: { x: noteBlock.positionX, y: noteBlock.positionY },
      size: { width: noteBlock.width, height: noteBlock.height },
    };
  }
  const maxWidth = Math.max(160, window.innerWidth - VIEWPORT_MARGIN * 2);
  const width = Math.min(noteBlock.width, maxWidth);
  const maxX = Math.max(0, window.innerWidth - width - VIEWPORT_MARGIN);
  const x = Math.min(Math.max(noteBlock.positionX, 0), maxX);
  return {
    position: { x, y: Math.max(0, noteBlock.positionY) },
    size: { width, height: noteBlock.height },
  };
}

export function NoteBlockCard({ noteBlock, onUpdate, onDelete, onBringToFront }: NoteBlockCardProps) {
  const initialLayout = clampToViewport(noteBlock);
  const [position, setPosition] = useState(initialLayout.position);
  const [size, setSize] = useState(initialLayout.size);
  const contentSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colorClass = COLOR_CLASSES[noteBlock.color] ?? COLOR_CLASSES.yellow;

  function handleContentChange(html: string) {
    if (contentSaveTimer.current) clearTimeout(contentSaveTimer.current);
    contentSaveTimer.current = setTimeout(() => {
      onUpdate(noteBlock.id, { content: html });
    }, SAVE_DEBOUNCE_MS);
  }

  function cycleColor() {
    const next = COLOR_ORDER[(COLOR_ORDER.indexOf(noteBlock.color) + 1) % COLOR_ORDER.length];
    onUpdate(noteBlock.id, { color: next });
  }

  return (
    <Rnd
      size={{ width: size.width, height: noteBlock.minimized ? MINIMIZED_HEIGHT : size.height }}
      position={position}
      dragHandleClassName="note-drag-handle"
      cancel=".note-editor-no-drag"
      enableResizing={!noteBlock.minimized}
      minWidth={160}
      minHeight={MINIMIZED_HEIGHT}
      style={{ zIndex: noteBlock.zIndex }}
      onMouseDown={() => onBringToFront(noteBlock.id)}
      onDragStop={(_event, data) => {
        const next = { x: data.x, y: data.y };
        setPosition(next);
        onUpdate(noteBlock.id, { positionX: next.x, positionY: next.y });
      }}
      onResizeStop={(_event, _direction, ref, _delta, newPosition) => {
        const next = { width: parseFloat(ref.style.width), height: parseFloat(ref.style.height) };
        setSize(next);
        setPosition(newPosition);
        onUpdate(noteBlock.id, {
          width: next.width,
          height: next.height,
          positionX: newPosition.x,
          positionY: newPosition.y,
        });
      }}
      bounds="parent"
      className={`flex flex-col overflow-hidden rounded border shadow-sm ${colorClass}`}
    >
      <div className="note-drag-handle flex min-h-9 cursor-move items-center justify-between gap-1 border-b border-black/10 px-1 py-1">
        <button
          type="button"
          title="Change color"
          aria-label="Change color"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-black/10"
          onClick={cycleColor}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full border border-black/20 ${COLOR_SWATCH_CLASSES[noteBlock.color] ?? COLOR_SWATCH_CLASSES.yellow}`}
          />
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title={noteBlock.minimized ? "Maximize" : "Minimize"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs leading-none hover:bg-black/10"
            onClick={() => onUpdate(noteBlock.id, { minimized: !noteBlock.minimized })}
          >
            {noteBlock.minimized ? "□" : "–"}
          </button>
          <button
            type="button"
            title="Delete note"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs leading-none hover:bg-black/10"
            onClick={() => onDelete(noteBlock.id)}
          >
            &times;
          </button>
        </div>
      </div>
      {!noteBlock.minimized && (
        <div className="flex-1 overflow-hidden p-1.5">
          <NoteEditor content={noteBlock.content} onChange={handleContentChange} />
        </div>
      )}
    </Rnd>
  );
}
