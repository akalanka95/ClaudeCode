import { Link } from "react-router-dom";
import type { BreadcrumbItem } from "../../types/api";
import { logout } from "../../hooks/useAuth";
import { Breadcrumbs } from "../board/Breadcrumbs";
import { SearchBar } from "../search/SearchBar";
import { BrandMark } from "./BrandMark";

const SEARCH_ENABLED = import.meta.env.VITE_ENABLE_SEARCH !== "false";
const INTERVIEW_ENABLED = import.meta.env.VITE_ENABLE_INTERVIEW !== "false";

interface AppHeaderProps {
  breadcrumbItems?: BreadcrumbItem[];
  showSearch?: boolean;
  showInterviewLink?: boolean;
}

function ChatBubbleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3C7.03 3 3 6.58 3 11c0 2.19 1.03 4.17 2.7 5.61-.1.98-.53 2.36-1.53 3.6a.5.5 0 0 0 .53.8c1.9-.46 3.36-1.28 4.24-1.9A11.7 11.7 0 0 0 12 19c4.97 0 9-3.58 9-8s-4.03-8-9-8Z" />
    </svg>
  );
}

export function AppHeader({ breadcrumbItems, showSearch = false, showInterviewLink = false }: AppHeaderProps) {
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
        {INTERVIEW_ENABLED && showInterviewLink && (
          <>
            {/* Mobile (<sm): icon-only, matching the search button's compact footprint. */}
            <Link
              to="/interview"
              aria-label="Mock Interview"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 sm:hidden"
            >
              <ChatBubbleIcon />
            </Link>
            {/* Desktop (sm+): labeled pill. */}
            <Link
              to="/interview"
              className="hidden shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 sm:flex"
            >
              <ChatBubbleIcon className="h-3.5 w-3.5" />
              Mock Interview
            </Link>
          </>
        )}
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
