import { useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";

interface NoteEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const HIGHLIGHT_COLOR = "#fbbf24";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1200;

export function NoteEditor({ content, onChange }: NoteEditorProps) {
  const [dropError, setDropError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      Image.configure({
        allowBase64: true,
        resize: {
          enabled: true,
          directions: ["bottom-right"],
          minWidth: 40,
          minHeight: 40,
          alwaysPreserveAspectRatio: true,
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "note-editor-no-drag h-full w-full resize-none overflow-y-auto text-[8px] leading-tight text-slate-800 focus:outline-none [&_h2]:text-[12px] [&_h2]:font-bold [&_h2]:leading-tight [&_h3]:text-[10px] [&_h3]:font-semibold [&_h3]:leading-tight [&_ul]:list-disc [&_ul]:pl-3 [&_ol]:list-decimal [&_ol]:pl-3 [&_li]:my-0 [&_img]:max-w-full",
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return false;

        event.preventDefault();
        setDropError(null);
        if (file.size > MAX_IMAGE_BYTES) {
          setDropError("Image is too large (max 8MB).");
          return true;
        }

        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        const pos = coords ? coords.pos : view.state.selection.from;
        downscaleImageToDataUrl(file)
          .then((dataUrl) => {
            view.dispatch(
              view.state.tr.insert(pos, view.state.schema.nodes.image.create({ src: dataUrl })),
            );
          })
          .catch(() => setDropError("Failed to load image."));
        return true;
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col gap-1">
      <Toolbar editor={editor} />
      {dropError && <p className="note-editor-no-drag text-[8px] text-red-600">{dropError}</p>}
      <div className="note-editor-no-drag flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="note-editor-no-drag flex flex-wrap items-center gap-1 border-b border-black/10 pb-1">
      <button
        type="button"
        className={`rounded px-1 text-[8px] font-semibold ${editor.isActive("bold") ? "bg-black/15" : "hover:bg-black/10"}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </button>
      <button
        type="button"
        className={`rounded px-1 text-[8px] italic ${editor.isActive("italic") ? "bg-black/15" : "hover:bg-black/10"}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </button>
      <button
        type="button"
        className={`rounded px-1 text-[8px] ${editor.isActive("highlight") ? "bg-black/15" : "hover:bg-black/10"}`}
        onClick={() => editor.chain().focus().toggleHighlight({ color: HIGHLIGHT_COLOR }).run()}
      >
        Highlight
      </button>
      <span className="mx-0.5 h-3 w-px bg-black/10" />
      <button
        type="button"
        title="Heading"
        className={`rounded px-1 text-[8px] font-bold ${editor.isActive("heading", { level: 2 }) ? "bg-black/15" : "hover:bg-black/10"}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <button
        type="button"
        title="Subheading"
        className={`rounded px-1 text-[8px] font-bold ${editor.isActive("heading", { level: 3 }) ? "bg-black/15" : "hover:bg-black/10"}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </button>
      <button
        type="button"
        title="Bullet list"
        className={`rounded px-1 text-[8px] ${editor.isActive("bulletList") ? "bg-black/15" : "hover:bg-black/10"}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        &bull; List
      </button>
      <button
        type="button"
        title="Numbered list"
        className={`rounded px-1 text-[8px] ${editor.isActive("orderedList") ? "bg-black/15" : "hover:bg-black/10"}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </button>
    </div>
  );
}

function downscaleImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        if (scale === 1) {
          resolve(reader.result as string);
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(mimeType, 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
