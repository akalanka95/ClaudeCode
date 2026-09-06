interface BackButtonProps {
  label: string;
  onClick: () => void;
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}

export function BackButton({ label, onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-fit shrink-0 items-center gap-1.5 self-start rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
    >
      <ArrowLeftIcon />
      {label}
    </button>
  );
}
