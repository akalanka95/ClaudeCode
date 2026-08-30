export interface ParentTopicNodeData extends Record<string, unknown> {
  label: string;
}

export function ParentTopicNode({ data }: { data: ParentTopicNodeData }) {
  return (
    <div className="min-w-[160px] rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-2 opacity-80 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Parent Topic
      </div>
      <div className="text-sm font-medium text-slate-600">{data.label}</div>
    </div>
  );
}
