interface AddNodeToolbarProps {
  onAddTopic: () => void;
  onAddNote: () => void;
  addTopicLabel?: string;
}

export function AddNodeToolbar({
  onAddTopic,
  onAddNote,
  addTopicLabel = "+ Topic",
}: AddNodeToolbarProps) {
  return (
    <div className="flex gap-2">
      <button
        className="rounded bg-slate-800 px-2.5 py-1 text-xs text-white hover:bg-slate-700"
        onClick={onAddTopic}
      >
        {addTopicLabel}
      </button>
      <button
        className="rounded bg-yellow-500 px-2.5 py-1 text-xs text-white hover:bg-yellow-600"
        onClick={onAddNote}
      >
        + Note
      </button>
    </div>
  );
}
