import { useRef, useState } from "react";
import { Rnd } from "react-rnd";
import type { NoteBlockResponse, UpdateNoteBlockRequest } from "../../types/api";
import { NoteEditor } from "./NoteEditor";

interface NoteBlockCardProps {
  noteBlock: NoteBlockResponse;
  onUpdate: (id: string, request: UpdateNoteBlockRequest) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
}

const COLOR_CLASSES: Record<string, string> = {
  yellow: "bg-yellow-100 border-yellow-300",
  pink: "bg-pink-100 border-pink-300",
  blue: "bg-blue-100 border-blue-300",
  green: "bg-green-100 border-green-300",
};

const COLOR_SWATCH_CLASSES: Record<string, string> = {
  yellow: "bg-yellow-400",
  pink: "bg-pink-400",
  blue: "bg-blue-400",
  green: "bg-green-400",
};

const COLOR_ORDER = ["yellow", "pink", "blue", "green"];
const MINIMIZED_HEIGHT = 28;
const SAVE_DEBOUNCE_MS = 600;

export function NoteBlockCard({ noteBlock, onUpdate, onDelete, onBringToFront }: NoteBlockCardProps) {
  const [position, setPosition] = useState({ x: noteBlock.positionX, y: noteBlock.positionY });
  const [size, setSize] = useState({ width: noteBlock.width, height: noteBlock.height });
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
      <div className="note-drag-handle flex cursor-move items-center justify-between gap-1 border-b border-black/10 px-1.5 py-1">
        <button
          type="button"
          title="Change color"
          className={`h-2.5 w-2.5 shrink-0 rounded-full border border-black/20 ${COLOR_SWATCH_CLASSES[noteBlock.color] ?? COLOR_SWATCH_CLASSES.yellow}`}
          onClick={cycleColor}
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={noteBlock.minimized ? "Maximize" : "Minimize"}
            className="rounded px-1 text-[9px] leading-none hover:bg-black/10"
            onClick={() => onUpdate(noteBlock.id, { minimized: !noteBlock.minimized })}
          >
            {noteBlock.minimized ? "□" : "–"}
          </button>
          <button
            type="button"
            title="Delete note"
            className="rounded px-1 text-[9px] leading-none hover:bg-black/10"
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
