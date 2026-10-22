import { memo } from "react";
import { VocabCard } from "./vocab-card";
import { isCardDue, type CardListItem } from "@/lib/card-utils";

interface VocabGridProps {
  cards: CardListItem[];
  now: number;
  onPlay: (text: string) => void;
  onDelete: (id: number) => void;
}

/** Lưới 3 cột: 1 cột (mobile) → 2 cột (sm) → 3 cột (lg+). */
function VocabGridBase({ cards, now, onPlay, onDelete }: VocabGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <VocabCard key={card.id} card={card} isDue={isCardDue(card, now)} onPlay={onPlay} onDelete={onDelete} />
      ))}
    </div>
  );
}

export const VocabGrid = memo(VocabGridBase);
