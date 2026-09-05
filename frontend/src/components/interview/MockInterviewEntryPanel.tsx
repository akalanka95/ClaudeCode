import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CollapsibleSidePanel } from "../common/CollapsibleSidePanel";

export function MockInterviewEntryPanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <CollapsibleSidePanel label="Mock interview" open={open} onOpenChange={setOpen}>
      <div className="flex w-full flex-col gap-3 p-4 sm:w-80">
        <h2 className="text-sm font-semibold text-slate-800">Mock Interview</h2>
        <p className="text-xs text-slate-500">
          Practice out loud with an AI interviewer grounded in your notes — a Grader scores each
          answer and a Coach suggests how to improve.
        </p>
        <button
          type="button"
          className="min-h-11 rounded bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-500"
          onClick={() => navigate("/interview")}
        >
          Start mock interview
        </button>
      </div>
    </CollapsibleSidePanel>
  );
}
