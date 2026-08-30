import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface TopicNodeData extends Record<string, unknown> {
  label: string;
  childBoardId: string | null;
  isSubtopicBoard: boolean;
  completed: boolean;
  subtopicCount: number | null;
  completedSubtopicCount: number | null;
  onRename: (label: string) => void;
  onToggleComplete: (completed: boolean) => void;
}

export function TopicNode(props: NodeProps) {
  const data = props.data as TopicNodeData;
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data.label);

  function commitRename() {
    setEditing(false);
    const trimmed = draftLabel.trim();
    if (trimmed && trimmed !== data.label) {
      data.onRename(trimmed);
    } else {
      setDraftLabel(data.label);
    }
  }

  function openNode() {
    if (data.isSubtopicBoard) {
      navigate(`/node/${props.id}/subtopic`);
    } else if (data.childBoardId) {
      navigate(`/board/${data.childBoardId}`);
    }
  }

  return (
    <div
      className={`min-w-[160px] rounded-lg border-2 bg-white px-3 py-2 shadow-sm ${
        props.selected ? "border-blue-500" : "border-slate-300"
      }`}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      {editing ? (
        <input
          autoFocus
          className="w-full rounded border border-slate-300 px-1 text-sm"
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraftLabel(data.label);
              setEditing(false);
            }
          }}
        />
      ) : (
        <div className="flex items-center gap-2">
          {data.isSubtopicBoard && (
            <input
              type="checkbox"
              checked={data.completed}
              onChange={(e) => data.onToggleComplete(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 shrink-0 cursor-pointer"
              aria-label={data.completed ? "Mark subtopic incomplete" : "Mark subtopic complete"}
            />
          )}
          <div
            className={`cursor-pointer text-sm font-medium text-slate-800 ${
              data.isSubtopicBoard && data.completed ? "line-through text-slate-400" : ""
            }`}
            onDoubleClick={() => setEditing(true)}
            onClick={openNode}
          >
            {data.label}
          </div>
        </div>
      )}

      {!data.isSubtopicBoard && !!data.subtopicCount && (
        <div className="mt-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${Math.round(((data.completedSubtopicCount ?? 0) / data.subtopicCount) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            {data.completedSubtopicCount ?? 0}/{data.subtopicCount} subtopics
          </div>
        </div>
      )}

      <div className="mt-1 flex gap-2 text-xs text-blue-600">
        {(data.isSubtopicBoard || data.childBoardId) && (
          <button className="hover:underline" onClick={openNode}>
            {data.isSubtopicBoard ? "Open subtopic" : "Open map"}
          </button>
        )}
        <button className="hover:underline" onClick={() => navigate(`/node/${props.id}/details`)}>
          Details
        </button>
      </div>
    </div>
  );
}
