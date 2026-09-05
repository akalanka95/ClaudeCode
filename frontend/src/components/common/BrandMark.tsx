import { Link } from "react-router-dom";

interface BrandMarkProps {
  linkable?: boolean;
}

export function BrandMark({ linkable = true }: BrandMarkProps) {
  const content = (
    <>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105">
        S
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-brand text-lg font-bold tracking-tight text-emerald-600 transition-opacity group-hover:opacity-80">
          SkillLoop
        </span>
        <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:inline">
          Learn &middot; Practice &middot; Identify gaps &middot; Improve
        </span>
      </span>
    </>
  );

  if (!linkable) {
    return <div className="flex items-center gap-2">{content}</div>;
  }

  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2">
      {content}
    </Link>
  );
}
