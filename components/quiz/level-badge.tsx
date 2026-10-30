import { LEVEL_LABELS, type LevelType } from "@/lib/quiz";

export function LevelBadge({ levelType, isRetry }: { levelType: LevelType; isRetry?: boolean }) {
  const label = LEVEL_LABELS[levelType];
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
      <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium ${label.color}`}>
        {label.icon} {label.text}
      </span>
      {isRetry && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-200 animate-pulse">
          🔄 Hỏi lại ở lượt cuối (ôn lại câu sai)
        </span>
      )}
    </div>
  );
}
