import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getNode, updateNodeDetails } from "../api/nodes";
import type { NodeResponse } from "../types/api";

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 28;
const DEFAULT_FONT_SIZE = 14;
const FONT_SIZE_STEP = 2;

export function DetailsPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const [node, setNode] = useState<NodeResponse | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);

  useEffect(() => {
    if (!nodeId) return;
    let cancelled = false;
    setLoading(true);
    getNode(nodeId)
      .then((fetched) => {
        if (cancelled) return;
        setNode(fetched);
        setContent(fetched.detailsContent ?? "");
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load this topic's details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nodeId]);

  async function handleSave() {
    if (!nodeId) return;
    setSaving(true);
    setError(null);
    try {
      await updateNodeDetails(nodeId, { detailsContent: content });
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-slate-500">Loading...</div>;
  }
  if (error && !node) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col gap-3 p-4">
      <button
        className="flex min-h-11 items-center self-start text-sm text-blue-600 hover:underline"
        onClick={() => navigate(-1)}
      >
        &larr; Back to board
      </button>
      <h1 className="text-xl font-semibold text-slate-800">{node?.label ?? "Details"}</h1>
      <div className="relative min-h-0 flex-1">
        <textarea
          className="h-full w-full resize-none rounded border border-slate-300 p-3 text-slate-800 focus:border-blue-400 focus:outline-none"
          style={{ fontSize }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your notes for this topic here..."
        />
        <div className="absolute bottom-3 left-3 flex flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            className="flex h-9 w-9 items-center justify-center text-lg leading-none text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            onClick={() => setFontSize((s) => Math.min(MAX_FONT_SIZE, s + FONT_SIZE_STEP))}
            disabled={fontSize >= MAX_FONT_SIZE}
          >
            +
          </button>
          <div className="h-px bg-slate-200" />
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            className="flex h-9 w-9 items-center justify-center text-lg leading-none text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            onClick={() => setFontSize((s) => Math.max(MIN_FONT_SIZE, s - FONT_SIZE_STEP))}
            disabled={fontSize <= MIN_FONT_SIZE}
          >
            −
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="min-h-11 rounded bg-slate-800 px-4 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
