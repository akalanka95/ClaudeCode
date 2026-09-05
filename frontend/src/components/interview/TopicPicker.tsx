import type { TopicOptionResponse } from "../../types/api";

interface TopicPickerProps {
  topics: TopicOptionResponse[];
  selectedIds: string[];
  onToggle: (nodeId: string) => void;
  isLoading: boolean;
}

export function TopicPicker({ topics, selectedIds, onToggle, isLoading }: TopicPickerProps) {
  if (isLoading) {
    return <div className="p-4 text-sm text-slate-500">Loading topics...</div>;
  }
  if (topics.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-400">
        No topics yet — create some on your map first.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-slate-100 rounded border border-slate-200">
      {topics.map((topic) => {
        const checked = selectedIds.includes(topic.nodeId);
        return (
          <label
            key={topic.nodeId}
            className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0"
              checked={checked}
              onChange={() => onToggle(topic.nodeId)}
            />
            <span className="min-w-0 flex-1">
              {topic.path.length > 0 && (
                <span className="block truncate text-xs text-slate-400">
                  {topic.path.join(" › ")}
                </span>
              )}
              <span className="block truncate text-sm font-medium text-slate-800">
                {topic.label ?? "Untitled"}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
