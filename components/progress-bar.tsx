"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({
  current,
  total,
  label,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full" id="progress-bar">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-foreground-muted">{label}</span>
          <span className="text-xs font-semibold text-foreground-dim">
            {current}/{total}
          </span>
        </div>
      )}
      <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background:
              percentage === 100
                ? "linear-gradient(90deg, #34d399, #22c55e)"
                : "linear-gradient(90deg, var(--sakura), var(--indigo))",
            boxShadow:
              percentage > 0
                ? percentage === 100
                  ? "0 0 12px var(--emerald-glow)"
                  : "0 0 12px var(--sakura-glow)"
                : "none",
          }}
        />
      </div>
    </div>
  );
}
