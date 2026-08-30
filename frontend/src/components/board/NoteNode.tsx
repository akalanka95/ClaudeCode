import { useState } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";

export interface NoteNodeData extends Record<string, unknown> {
  noteText: string;
  onChangeText: (noteText: string) => void;
  onResize: (width: number, height: number) => void;
}

export function NoteNode(props: NodeProps) {
  const data = props.data as NoteNodeData;
  const [text, setText] = useState(data.noteText);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`h-full min-w-[180px] rounded-lg border-2 bg-yellow-50 px-3 py-2 shadow-sm ${
        props.selected ? "border-blue-500" : "border-yellow-300"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeResizer
        isVisible={props.selected || hovered}
        minWidth={180}
        minHeight={80}
        onResizeEnd={(_event, params) => data.onResize(params.width, params.height)}
      />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <textarea
        className="nodrag h-full w-full resize-none border-none bg-transparent text-sm text-slate-700 focus:outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== data.noteText) {
            data.onChangeText(text);
          }
        }}
        placeholder="Note..."
      />
    </div>
  );
}
