import { memo } from "react";
import { VocabCard } from "./vocab-card";
import { isCardDue, type CardListItem } from "@/lib/card-utils";

interface VocabGridProps {
  cards: CardListItem[];
  now: number;
  onPlay: (text: string) => void;
  onDelete: (id: number) => void;
  /** Selection mode */
  selecting?: boolean;
  selectedIds?: Set<number>;
  toggleSelect?: (id: number) => void;
}

/** Lưới 3 cột: 1 cột (mobile) → 2 cột (sm) → 3 cột (lg+). */
function VocabGridBase({
  cards,
  now,
  onPlay,
  onDelete,
  selecting = false,
  selectedIds,
  toggleSelect,
}: VocabGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const isSelected = selecting && selectedIds?.has(card.id);
        return (
          <div
            key={card.id}
            className={`relative ${selecting ? "cursor-pointer" : ""} ${
              isSelected ? "ring-2 ring-indigo rounded-xl" : ""
            }`}
            onClick={selecting ? () => toggleSelect?.(card.id) : undefined}
          >
            {selecting && (
              <div className="absolute left-2 top-2 z-10">
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={() => toggleSelect?.(card.id)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-indigo"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <VocabCard
              card={card}
              isDue={isCardDue(card, now)}
              onPlay={onPlay}
              onDelete={onDelete}
            />
          </div>
        );
      })}
    </div>
  );
}

export const VocabGrid = memo(VocabGridBase);
