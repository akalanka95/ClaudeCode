import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../hooks/useSearch";
import type { SearchResultResponse } from "../../types/api";

interface SearchResultsProps {
  isFetching: boolean;
  results: SearchResultResponse[];
  onSelect: (result: SearchResultResponse) => void;
}

function SearchResults({ isFetching, results, onSelect }: SearchResultsProps) {
  if (isFetching && results.length === 0) {
    return <div className="px-3 py-2.5 text-sm text-slate-400">Searching...</div>;
  }
  if (!isFetching && results.length === 0) {
    return <div className="px-3 py-2.5 text-sm text-slate-400">No matches.</div>;
  }
  return (
    <>
      {results.map((result) => (
        <button
          key={result.nodeId}
          type="button"
          // onMouseDown fires before the input's onBlur, so the click registers before the
          // dropdown closes itself.
          onMouseDown={() => onSelect(result)}
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
    </>
  );
}

export function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const { data, isFetching } = useSearch(query);
  const results = data?.results ?? [];
  const showResults = open && query.trim().length >= 2;

  function goToResult(result: SearchResultResponse) {
    setQuery("");
    setOpen(false);
    setMobileExpanded(false);
    navigate(`/board/${result.boardId}`);
  }

  function closeMobile() {
    setQuery("");
    setOpen(false);
    setMobileExpanded(false);
  }

  return (
    <>
      {/* Mobile (<sm): a tappable icon that expands into a full-width overlay, so the input
          never has to compete with the logo/breadcrumbs for a sliver of header width. */}
      <button
        type="button"
        onClick={() => setMobileExpanded(true)}
        aria-label="Search"
        className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-slate-500 hover:bg-slate-50 sm:hidden"
      >
        <span aria-hidden>⌕</span>
      </button>

      {mobileExpanded && (
        <div className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white shadow-sm sm:hidden">
          <div className="relative flex items-center gap-2 p-2">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeMobile();
              }}
              placeholder="Search your map..."
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close search"
              className="flex h-11 w-11 shrink-0 items-center justify-center text-lg text-slate-500"
            >
              <span aria-hidden>✕</span>
            </button>
            {showResults && (
              <div className="absolute inset-x-2 top-full mt-1.5 max-h-[70vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                <SearchResults isFetching={isFetching} results={results} onSelect={goToResult} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop (sm+): always-visible inline search, unchanged from before. */}
      <div className="relative ml-auto hidden w-full max-w-xs sm:block">
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
        {showResults && (
          <div className="absolute right-0 z-20 mt-1.5 max-h-80 w-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            <SearchResults isFetching={isFetching} results={results} onSelect={goToResult} />
          </div>
        )}
      </div>
    </>
  );
}
