interface LimitProgressProps {
  current: number;
  max: number;
}

export function LimitProgress({ current, max }: LimitProgressProps) {
  const reached = current >= max;
  const nearLimit = current >= max * 0.8;
  const barColor = reached
    ? "bg-gradient-to-r from-rose to-red-500"
    : nearLimit
      ? "bg-gradient-to-r from-amber-500 to-orange-500"
      : "bg-gradient-to-r from-emerald to-teal-500";

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Giới hạn</span>
        <span className={`text-xs font-extrabold ${reached ? "text-rose" : "text-emerald"}`}>
          {current} / {max}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-border/50 bg-surface">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${Math.min((current / max) * 100, 100)}%` }}
        />
      </div>
      {reached && <p className="mt-1 animate-pulse text-xs font-semibold text-rose">⚠️ Đã đạt giới hạn!</p>}
    </div>
  );
}
