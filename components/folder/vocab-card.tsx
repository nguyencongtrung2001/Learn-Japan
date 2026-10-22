import { memo } from "react";
import { growthIcon } from "@/lib/growth";
import type { CardListItem } from "@/lib/card-utils";

interface VocabCardProps {
  card: CardListItem;
  isDue: boolean;
  onPlay: (text: string) => void;
  onDelete: (id: number) => void;
}

/**
 * Thẻ từ vựng dạng compact (dùng trong lưới 3 cột).
 * - React.memo: chỉ render lại khi chính thẻ này đổi.
 * - Class `.vocab-card` (globals.css): không dùng backdrop-filter, có content-visibility:auto
 *   nên thẻ ngoài màn hình không tốn chi phí layout/paint.
 */
function VocabCardBase({ card, isDue, onPlay, onDelete }: VocabCardProps) {
  return (
    <article className={isDue ? "vocab-card vocab-card--due" : "vocab-card"}>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className="truncate text-base font-extrabold leading-tight tracking-tight text-foreground"
            title={card.word}
          >
            {card.word}
          </h3>
          {card.phonetic && (
            <span className="mt-0.5 inline-block max-w-full truncate rounded bg-indigo/10 px-1.5 py-px text-[11px] font-bold text-indigo-light">
              {card.phonetic}
            </span>
          )}
        </div>
        <span className="shrink-0 text-base leading-none" title={`Level ${card.growthLevel}`}>
          {growthIcon(card.growthLevel)}
        </span>
      </header>

      <p className="truncate text-sm font-semibold text-foreground/90" title={card.translation}>
        {card.translation}
      </p>

      {card.definition && (
        <p className="line-clamp-1 text-xs leading-snug text-foreground-muted" title={card.definition}>
          {card.definition}
        </p>
      )}
      {card.example && (
        <p
          className="line-clamp-1 border-l-2 border-emerald/50 pl-2 text-xs italic leading-snug text-foreground-dim"
          title={card.example}
        >
          &quot;{card.example}&quot;
        </p>
      )}

      <footer className="mt-auto flex items-center justify-between border-t border-border/40 pt-2">
        <span className="text-[11px] font-semibold text-foreground-muted">Lv.{card.growthLevel}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onPlay(card.word)}
            className="cursor-pointer rounded-lg bg-surface-hover/60 px-2 py-1 text-sm text-indigo-light transition-colors hover:bg-indigo/15"
            aria-label={`Nghe phát âm ${card.word}`}
            title="Nghe phát âm"
          >
            🔊
          </button>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            className="cursor-pointer rounded-lg bg-surface-hover/60 px-2 py-1 text-sm text-rose/70 transition-colors hover:bg-rose/10 hover:text-rose"
            aria-label={`Xóa thẻ ${card.word}`}
            title="Xóa thẻ"
          >
            🗑️
          </button>
        </div>
      </footer>
    </article>
  );
}

export const VocabCard = memo(VocabCardBase);
