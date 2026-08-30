import { Link } from "react-router-dom";
import type { BreadcrumbItem } from "../../types/api";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-slate-600">
      <Link to="/" className="hover:underline">
        Home
      </Link>
      {items.map((item, index) => (
        <span key={item.nodeId} className="flex items-center gap-1">
          <span>/</span>
          {index === items.length - 1 ? (
            <span className="text-slate-800">{item.label ?? "Untitled"}</span>
          ) : (
            <Link to={`/board/${item.boardId}`} className="hover:underline">
              {item.label ?? "Untitled"}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
