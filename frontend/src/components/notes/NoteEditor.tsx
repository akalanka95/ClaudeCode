import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";

interface NoteEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const HIGHLIGHT_COLOR = "#fbbf24";

export function NoteEditor({ content, onChange }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Highlight.configure({ multicolor: true })],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "note-editor-no-drag h-full w-full resize-none overflow-y-auto text-[8px] leading-tight text-slate-800 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="note-editor-no-drag flex items-center gap-1 border-b border-black/10 pb-1">
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
      </div>
      <div className="note-editor-no-drag flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
