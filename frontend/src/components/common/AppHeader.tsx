import type { BreadcrumbItem } from "../../types/api";
import { logout } from "../../hooks/useAuth";
import { Breadcrumbs } from "../board/Breadcrumbs";
import { SearchBar } from "../search/SearchBar";
import { BrandMark } from "./BrandMark";

const SEARCH_ENABLED = import.meta.env.VITE_ENABLE_SEARCH !== "false";

interface AppHeaderProps {
  breadcrumbItems?: BreadcrumbItem[];
  showSearch?: boolean;
}

export function AppHeader({ breadcrumbItems, showSearch = false }: AppHeaderProps) {
  return (
    <header className="relative flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5 shadow-sm sm:gap-3">
      <BrandMark />
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <>
          <span className="h-6 w-px shrink-0 bg-slate-200" />
          <Breadcrumbs items={breadcrumbItems} />
        </>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {SEARCH_ENABLED && showSearch && <SearchBar />}
        <button
          type="button"
          onClick={logout}
          className="flex shrink-0 items-center rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
