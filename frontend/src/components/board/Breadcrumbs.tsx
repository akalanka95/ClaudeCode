import { Link } from "react-router-dom";
import type { BreadcrumbItem } from "../../types/api";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto text-sm text-slate-500">
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
  );
}
