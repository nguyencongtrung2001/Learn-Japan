import { memo, useEffect, useRef, useState } from "react";
import { growthIcon } from "@/lib/growth";
import type { CardListItem } from "@/lib/card-utils";

interface VocabCardProps {
  card: CardListItem;
  isDue: boolean;
  onPlay: (text: string) => void;
  onDelete: (id: number) => void;
  onEdit?: (card: CardListItem) => void;
}

/** Growth-level accent colours (maps 0-6). */
const LEVEL_COLORS: Record<number, { from: string; to: string }> = {
  0: { from: "var(--foreground-dim)", to: "var(--foreground-muted)" },
  1: { from: "var(--emerald)", to: "var(--emerald-light)" },
  2: { from: "var(--emerald)", to: "var(--indigo)" },
  3: { from: "var(--indigo)", to: "var(--sakura)" },
  4: { from: "var(--sakura)", to: "var(--gold)" },
  5: { from: "var(--gold)", to: "var(--rose)" },
  6: { from: "var(--rose)", to: "var(--sakura)" },
};

function VocabCardBase({ card, isDue, onPlay, onDelete, onEdit }: VocabCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  // Click-outside → collapse
  useEffect(() => {
    if (!isExpanded) return;
    function handleClickOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  const colors = LEVEL_COLORS[Math.min(card.growthLevel, 6)];

  return (
    <article
      ref={cardRef}
      className={`vocab-card-v2 ${isExpanded ? "vocab-card-v2--open" : ""} ${isDue ? "vocab-card-v2--due" : ""}`}
      style={
        {
          "--accent-from": colors.from,
          "--accent-to": colors.to,
        } as React.CSSProperties
      }
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      {/* Accent bar */}
      <div className="vocab-card-v2__accent" />

      {/* Header */}
      <header className="vocab-card-v2__header">
        <div className="vocab-card-v2__word-group">
          <h3 className={`vocab-card-v2__word ${isExpanded ? "" : "truncate"}`}>
            {card.word}
          </h3>
          {card.phonetic && (
            <span className="vocab-card-v2__phonetic">{card.phonetic}</span>
          )}
        </div>
        <span className="vocab-card-v2__growth" title={`Level ${card.growthLevel}`}>
          {growthIcon(card.growthLevel)}
        </span>
      </header>

      {/* Translation */}
      <p className={`vocab-card-v2__translation ${isExpanded ? "" : "truncate"}`}>
        {card.translation}
      </p>

      {/* Expanded content — no line-clamp, no truncation, no shadow */}
      {isExpanded && (
        <div className="vocab-card-v2__details">
          {card.definition && (
            <div className="vocab-card-v2__definition">
              <span className="vocab-card-v2__label">Định nghĩa</span>
              <p>{card.definition}</p>
            </div>
          )}
          {card.example && (
            <div className="vocab-card-v2__example">
              <span className="vocab-card-v2__label">Ví dụ</span>
              <p>&quot;{card.example}&quot;</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="vocab-card-v2__footer">
        <span className="vocab-card-v2__level">Lv.{card.growthLevel}</span>
        <div className="vocab-card-v2__actions">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card);
              }}
              className="vocab-card-v2__btn vocab-card-v2__btn--edit"
              aria-label={`Sửa thẻ ${card.word}`}
              title="Chỉnh sửa thẻ"
            >
              ✏️
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(card.word);
            }}
            className="vocab-card-v2__btn vocab-card-v2__btn--play"
            aria-label={`Nghe phát âm ${card.word}`}
            title="Nghe phát âm"
          >
            🔊
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="vocab-card-v2__btn vocab-card-v2__btn--delete"
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
