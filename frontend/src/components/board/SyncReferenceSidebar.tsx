import { useState } from "react";
import { SyncPanel } from "./SyncPanel";
import { ReferenceMaterialsPanel } from "./ReferenceMaterialsPanel";

interface SyncReferenceSidebarProps {
  nodeId: string;
}

export function SyncReferenceSidebar({ nodeId }: SyncReferenceSidebarProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        className="flex shrink-0 items-center gap-1 border-l border-slate-200 px-2 text-sm text-slate-600 hover:bg-slate-50"
        onClick={() => setOpen(true)}
      >
        <span className="[writing-mode:vertical-rl]">Sync &amp; reference materials</span>
        <span aria-hidden>‹</span>
      </button>
    );
  }

  return (
    <div className="flex h-full shrink-0 flex-col border-l border-slate-200">
      <button
        type="button"
        className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={() => setOpen(false)}
      >
        Sync &amp; reference materials
        <span aria-hidden>›</span>
      </button>
      <div className="flex flex-1 overflow-hidden">
        <SyncPanel nodeId={nodeId} />
        <ReferenceMaterialsPanel nodeId={nodeId} />
      </div>
    </div>
  );
}
