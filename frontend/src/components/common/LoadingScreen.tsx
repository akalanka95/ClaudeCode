interface LoadingScreenProps {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ label = "Loading...", fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? "h-screen bg-slate-50" : "py-10"
      }`}
    >
      <span className="flex h-9 w-9 animate-pulse items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white shadow-sm">
        S
      </span>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}
