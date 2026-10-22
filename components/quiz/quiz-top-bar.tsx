import { growthIcon, MAX_GROWTH_LEVEL } from "@/lib/growth";
import type { Phase } from "@/lib/quiz";

interface QuizTopBarProps {
  phase: Phase;
  /** Level hiện tại của từng từ trong lô học (chỉ dùng ở chế độ học). */
  levels: { word: string; level: number }[];
  /** Vị trí câu hiện tại / tổng số (chỉ dùng ở chế độ ôn tập). */
  reviewPosition: { current: number; total: number };
  onExit: () => void;
}

export function QuizTopBar({ phase, levels, reviewPosition, onExit }: QuizTopBarProps) {
  const total = levels.length * MAX_GROWTH_LEVEL;
  const done = levels.reduce((sum, l) => sum + l.level, 0);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="cursor-pointer text-sm text-foreground-muted transition-colors hover:text-indigo-light"
        >
          ✕ Thoát
        </button>

        {phase === "learn" && (
          <div className="flex items-center gap-2">
            {levels.map((l, i) => (
              <span key={i} className="text-sm" title={`${l.word} — Lv.${l.level}`}>
                {growthIcon(l.level)}
              </span>
            ))}
          </div>
        )}

        <div className="text-xs text-foreground-dim">
          {phase === "learn" ? `${percent}%` : `${reviewPosition.current}/${reviewPosition.total}`}
        </div>
      </div>

      {phase === "learn" && (
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald to-teal-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </>
  );
}
