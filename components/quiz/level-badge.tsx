import { LEVEL_LABELS, type LevelType } from "@/lib/quiz";

export function LevelBadge({ levelType }: { levelType: LevelType }) {
  const label = LEVEL_LABELS[levelType];
  return (
    <div className="mb-4 flex justify-center">
      <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium ${label.color}`}>
        {label.icon} {label.text}
      </span>
    </div>
  );
}
