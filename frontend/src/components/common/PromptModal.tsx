import { useState } from "react";

interface PromptModalProps {
  title: string;
  placeholder?: string;
  confirmLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function PromptModal({
  title,
  placeholder,
  confirmLabel = "Create",
  onSubmit,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-80 rounded-lg bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-sm font-medium text-slate-800">{title}</h2>
        <input
          autoFocus
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
            onClick={submit}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
