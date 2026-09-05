import type { ReactNode } from "react";

interface CollapsibleSidePanelProps {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function CollapsibleSidePanel({ label, open, onOpenChange, children }: CollapsibleSidePanelProps) {
  if (!open) {
    return (
      <>
        <button
          type="button"
          className="hidden shrink-0 items-center gap-1 border-l border-slate-200 px-2 text-sm text-slate-600 hover:bg-slate-50 sm:flex"
          onClick={() => onOpenChange(true)}
        >
          <span className="[writing-mode:vertical-rl]">{label}</span>
          <span aria-hidden>‹</span>
        </button>
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 z-30 flex min-h-11 w-full items-center justify-center gap-2 border-t border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] sm:hidden"
          onClick={() => onOpenChange(true)}
        >
          {label}
          <span aria-hidden>▲</span>
        </button>
      </>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[75vh] flex-col rounded-t-2xl bg-white shadow-2xl sm:static sm:inset-auto sm:z-auto sm:h-full sm:max-h-none sm:shrink-0 sm:rounded-none sm:border-l sm:border-slate-200 sm:shadow-none">
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-300 sm:hidden" />
      <button
        type="button"
        className="flex min-h-11 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={() => onOpenChange(false)}
      >
        {label}
        <span aria-hidden className="text-lg leading-none">
          ✕
        </span>
      </button>
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">{children}</div>
    </div>
  );
}
