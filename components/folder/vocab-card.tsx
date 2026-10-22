import { memo, useState } from "react";
import { growthIcon } from "@/lib/growth";
import type { CardListItem } from "@/lib/card-utils";

interface VocabCardProps {
  card: CardListItem;
  isDue: boolean;
  onPlay: (text: string) => void;
  onDelete: (id: number) => void;
}


function VocabCardBase({ card, isDue, onPlay, onDelete }: VocabCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <article
      className={`${isDue ? "vocab-card vocab-card--due" : "vocab-card"} border border-gray-200 rounded-lg p-4 min-h-[80px] transition-transform duration-200 ${isExpanded ? "scale-200" : ""} cursor-pointer hover:shadow-lg origin-center`}
      onClick={() => setIsExpanded(prev => !prev)}
    >
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

      {isExpanded && card.definition && (
        <p className="line-clamp-1 text-xs leading-snug text-foreground-muted" title={card.definition}>
          {card.definition}
        </p>
      )}
      {isExpanded && card.example && (
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
            onClick={(e) => { e.stopPropagation(); onPlay(card.word); }}
            className="cursor-pointer rounded-lg bg-surface-hover/60 px-2 py-1 text-sm text-indigo-light transition-colors hover:bg-indigo/15"
            aria-label={`Nghe phát âm ${card.word}`}
            title="Nghe phát âm"
          >
            🔊
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
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
