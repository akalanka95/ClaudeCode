import { useState } from "react";
import { useReferenceMaterials } from "../../hooks/useReferenceMaterials";

interface ReferenceMaterialsPanelProps {
  nodeId: string;
}

export function ReferenceMaterialsPanel({ nodeId }: ReferenceMaterialsPanelProps) {
  const { referencesQuery, createReference, deleteReference } = useReferenceMaterials(nodeId);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  function handleAdd() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    createReference.mutate(
      { url: trimmedUrl, title: title.trim() || null },
      {
        onSuccess: () => {
          setUrl("");
          setTitle("");
        },
      },
    );
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col gap-3 border-l border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-800">Reference Materials</h2>
      <p className="text-xs text-slate-500">
        Links you've used to research this subtopic — articles, videos, docs — kept here for
        later reuse.
      </p>

      <div className="flex flex-col gap-2 rounded border border-slate-200 p-3">
        <input
          className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <button
          className="self-end rounded bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
          onClick={handleAdd}
          disabled={!url.trim() || createReference.isPending}
        >
          Add link
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {referencesQuery.isLoading && <div className="text-sm text-slate-500">Loading...</div>}
        {referencesQuery.isError && (
          <div className="text-sm text-red-600">Failed to load reference materials.</div>
        )}
        {referencesQuery.data?.length === 0 && (
          <div className="text-sm text-slate-400">No reference materials yet.</div>
        )}
        {referencesQuery.data?.map((reference) => (
          <div
            key={reference.id}
            className="group flex items-start justify-between gap-2 rounded border border-slate-200 p-2"
          >
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-blue-600 hover:underline"
            >
              {reference.title || reference.url}
            </a>
            <button
              className="shrink-0 text-xs text-slate-400 hover:text-red-600"
              onClick={() => deleteReference.mutate(reference.id)}
              aria-label="Remove reference"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
