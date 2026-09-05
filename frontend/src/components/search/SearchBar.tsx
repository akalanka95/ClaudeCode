import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../hooks/useSearch";
import type { SearchResultResponse } from "../../types/api";

export function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useSearch(query);
  const results = data?.results ?? [];

  function goToResult(result: SearchResultResponse) {
    setQuery("");
    setOpen(false);
    navigate(`/board/${result.boardId}`);
  }

  return (
    <div className="relative ml-auto w-full max-w-xs">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQuery("");
            setOpen(false);
          }
        }}
        placeholder="Search your map..."
        className="w-full rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 z-20 mt-1.5 max-h-80 w-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {isFetching && results.length === 0 && (
            <div className="px-3 py-2.5 text-sm text-slate-400">Searching...</div>
          )}
          {!isFetching && results.length === 0 && (
            <div className="px-3 py-2.5 text-sm text-slate-400">No matches.</div>
          )}
          {results.map((result) => (
            <button
              key={result.nodeId}
              type="button"
              // onMouseDown fires before the input's onBlur, so the click registers before the
              // dropdown closes itself.
              onMouseDown={() => goToResult(result)}
              className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
            >
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {result.type === "TOPIC" ? "Topic" : "Note"}
                </span>
                <span className="truncate text-sm font-medium text-slate-800">
                  {result.label ?? "Untitled"}
                </span>
              </div>
              {result.snippet && (
                <div className="mt-0.5 truncate text-xs text-slate-400">{result.snippet}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
