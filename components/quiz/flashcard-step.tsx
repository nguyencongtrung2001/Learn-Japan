import { QuestionPanel } from "./question-panel";
import type { Card } from "@/db/schema";

interface FlashcardStepProps {
  card: Card;
  onPlay: (text: string) => void;
  onNext: () => void;
}

export function FlashcardStep({ card, onPlay, onNext }: FlashcardStepProps) {
  return (
    <QuestionPanel feedback={null} className="mb-6 animate-fade-in border-t-white/10 p-6 sm:p-10">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald to-teal-500 opacity-50" />

      {card.imageUrl && (
        <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-2xl border-2 border-white/10 shadow-lg sm:h-32 sm:w-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mb-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{card.word}</div>
      {card.phonetic && (
        <div className="mb-2 inline-block rounded-full bg-indigo/10 px-3 py-1 text-sm font-medium text-indigo-light sm:text-base">
          {card.phonetic}
        </div>
      )}
      <div className="mb-4 mt-2 text-xl font-semibold text-foreground sm:text-2xl">{card.translation}</div>

      {card.definition && <div className="mb-4 px-4 text-sm text-foreground-dim sm:text-base">{card.definition}</div>}

      {card.example && (
        <div className="mb-6 rounded-xl border border-border/50 bg-surface/50 p-4 text-left text-sm italic text-foreground-muted sm:text-base">
          💬 &quot;{card.example}&quot;
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onPlay(card.word)}
          className="group flex shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-border bg-surface p-4 text-2xl transition-all hover:border-indigo/30 hover:bg-surface-hover"
          aria-label="Nghe phát âm"
          title="Nghe phát âm"
        >
          <span className="transition-transform group-hover:scale-110">🔊</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 cursor-pointer rounded-2xl bg-gradient-to-r from-emerald to-teal-500 py-4 text-lg font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald/25 active:scale-[0.98]"
        >
          ✅ Đã nhớ — Tiếp tục
        </button>
      </div>
    </QuestionPanel>
  );
}
