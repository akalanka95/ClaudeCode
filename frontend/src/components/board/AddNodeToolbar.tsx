interface AddNodeToolbarProps {
  onAddTopic: () => void;
  onAddNote: () => void;
}

export function AddNodeToolbar({ onAddTopic, onAddNote }: AddNodeToolbarProps) {
  return (
    <div className="flex gap-2">
      <button
        className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        onClick={onAddTopic}
      >
        + Topic
      </button>
      <button
        className="rounded bg-yellow-500 px-3 py-1.5 text-sm text-white hover:bg-yellow-600"
        onClick={onAddNote}
      >
        + Note
      </button>
    </div>
  );
}
