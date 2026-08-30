import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface TopicNodeData extends Record<string, unknown> {
  label: string;
  childBoardId: string | null;
  onRename: (label: string) => void;
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
        <div
          className="cursor-pointer text-sm font-medium text-slate-800"
          onDoubleClick={() => setEditing(true)}
          onClick={() => data.childBoardId && navigate(`/board/${data.childBoardId}`)}
        >
          {data.label}
        </div>
      )}

      <div className="mt-1 flex gap-2 text-xs text-blue-600">
        {data.childBoardId && (
          <button
            className="hover:underline"
            onClick={() => navigate(`/board/${data.childBoardId}`)}
          >
            Open map
          </button>
        )}
        <button className="hover:underline" onClick={() => navigate(`/node/${props.id}/details`)}>
          Details
        </button>
      </div>
    </div>
  );
}
