import { useState } from "react";

interface AnswerInputProps {
  disabled: boolean;
  submitting: boolean;
  onSubmit: (answer: string) => void;
}

export function AnswerInput({ disabled, submitting, onSubmit }: AnswerInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="min-h-32 w-full resize-none rounded border border-slate-300 p-3 text-sm text-slate-800 focus:border-blue-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
        placeholder="Type your answer here..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      <button
        type="button"
        className="min-h-11 w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 sm:w-auto sm:self-end"
        onClick={handleSubmit}
        disabled={disabled || submitting || !value.trim()}
      >
        {submitting ? "Submitting..." : "Submit answer"}
      </button>
    </div>
  );
}
