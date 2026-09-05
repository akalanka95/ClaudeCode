import { Link } from "react-router-dom";
import type { BreadcrumbItem } from "../../types/api";
import { SearchBar } from "../search/SearchBar";

const SEARCH_ENABLED = import.meta.env.VITE_ENABLE_SEARCH !== "false";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link to="/" className="group flex items-center gap-2 shrink-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105">
          S
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-brand text-lg font-bold tracking-tight text-emerald-600 transition-opacity group-hover:opacity-80">
            SkillLoop
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Learn &middot; Practice &middot; Identify gaps &middot; Improve
          </span>
        </span>
      </Link>
      {items.length > 0 && <span className="h-6 w-px shrink-0 bg-slate-200" />}
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-slate-500">
        {items.map((item, index) => (
          <span key={item.nodeId} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && <span className="text-slate-300">&rsaquo;</span>}
            {index === items.length - 1 ? (
              <span className="truncate font-semibold text-slate-900">{item.label ?? "Untitled"}</span>
            ) : (
              <Link
                to={`/board/${item.boardId}`}
                className="truncate transition-colors hover:text-blue-600"
              >
                {item.label ?? "Untitled"}
              </Link>
            )}
          </span>
        ))}
      </div>
      {SEARCH_ENABLED && <SearchBar />}
    </nav>
  );
}
