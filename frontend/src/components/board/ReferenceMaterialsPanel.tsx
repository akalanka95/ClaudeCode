import { useState } from "react";
import { useReferenceMaterials } from "../../hooks/useReferenceMaterials";

interface ReferenceMaterialsPanelProps {
  nodeId: string;
  description?: string;
}

const DEFAULT_DESCRIPTION =
  "Links you've used to research this topic — articles, videos, docs — kept here for later reuse.";

export function ReferenceMaterialsPanel({
  nodeId,
  description = DEFAULT_DESCRIPTION,
}: ReferenceMaterialsPanelProps) {
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
    <aside className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto border-l border-slate-200 p-4 sm:w-80">
      <h2 className="text-sm font-semibold text-slate-800">Reference Materials</h2>
      <p className="text-xs text-slate-500">{description}</p>

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
          {createReference.isPending ? "Fetching preview..." : "Add link"}
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
        {referencesQuery.data?.map((reference) => {
          const displayTitle = reference.title || reference.previewTitle || reference.url;
          return (
            <div key={reference.id} className="rounded border border-slate-200 p-2">
              <div className="flex items-start justify-between gap-2">
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 gap-2"
                >
                  {reference.previewImageUrl && (
                    <img
                      src={reference.previewImageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="break-words text-sm font-medium text-blue-600 hover:underline">
                      {displayTitle}
                    </div>
                    {reference.previewDescription && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        {reference.previewDescription}
                      </p>
                    )}
                  </div>
                </a>
                <button
                  className="shrink-0 text-xs text-slate-400 hover:text-red-600"
                  onClick={() => deleteReference.mutate(reference.id)}
                  aria-label="Remove reference"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
