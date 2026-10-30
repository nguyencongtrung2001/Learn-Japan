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
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-bold text-foreground-muted flex items-center gap-1.5">
          <span>📊</span>
          <span>Giới hạn:</span>
          <span className={`font-black ${reached ? "text-rose" : "text-emerald"}`}>
            {current}/{max}
          </span>
        </span>
        <span className="text-[11px] font-bold text-foreground-dim">
          {Math.round((current / max) * 100)}%
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-border/50 bg-surface">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${Math.min((current / max) * 100, 100)}%` }}
        />
      </div>
      {reached && (
        <p className="mt-1 animate-pulse text-xs font-bold text-rose">
          ⚠️ Đã đạt giới hạn ({current}/{max})!
        </p>
      )}
    </div>
  );
}
