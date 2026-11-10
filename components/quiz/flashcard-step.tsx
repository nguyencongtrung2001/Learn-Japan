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
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald via-indigo to-sakura opacity-60" />

      {/* 3. Hình ảnh nghĩa cốt lõi */}
      {card.imageUrl && (
        <div className="mx-auto mb-6 flex flex-col items-center">
          <div className="max-h-56 max-w-xs overflow-hidden rounded-2xl border-2 border-indigo/20 shadow-xl bg-surface/80 p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.imageUrl}
              alt={card.word}
              loading="lazy"
              decoding="async"
              className="max-h-48 w-auto object-contain rounded-xl"
            />
          </div>
          <span className="mt-1.5 text-[11px] font-semibold text-foreground-dim uppercase tracking-wider">
            🖼️ Hình ảnh nghĩa cốt lõi
          </span>
        </div>
      )}

      {/* 1. Từ vựng / cụm từ Nhật & Kanji */}
      <div className="mb-2 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
        {card.kanji ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl sm:text-5xl font-black text-foreground">{card.kanji}</span>
            <span className="text-lg sm:text-xl font-bold text-sakura-light">{card.word}</span>
          </div>
        ) : (
          card.word
        )}
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
        {/* 2. Phiên âm / Furigana / Romaji */}
        {card.phonetic && (
          <div className="inline-block rounded-full bg-indigo/15 border border-indigo/30 px-3.5 py-1 text-sm sm:text-base font-bold text-indigo-light">
            {card.phonetic}
          </div>
        )}
        {card.partOfSpeech && (
          <span className="rounded-full bg-sakura/15 border border-sakura/30 px-3 py-1 text-xs font-bold text-sakura-light">
            {card.partOfSpeech}
          </span>
        )}
      </div>

      {/* Nghĩa tiếng Việt */}
      <div className="mb-4 text-2xl font-extrabold text-foreground sm:text-3xl">
        {card.translation}
      </div>

      {/* 4. Ngữ cảnh sử dụng & Sắc thái */}
      {card.definition && (
        <div className="mb-4 rounded-xl border border-border/60 bg-surface/40 p-3.5 text-left text-sm text-foreground-muted sm:text-base leading-relaxed">
          <div className="text-xs font-bold uppercase tracking-wider text-foreground-dim mb-1 flex items-center gap-1.5">
            <span>💡</span> Ngữ cảnh sử dụng & Sắc thái
          </div>
          <p className="text-foreground">{card.definition}</p>
        </div>
      )}

      {/* 5. Câu ví dụ thực tế */}
      {card.example && (
        <div className="mb-6 rounded-xl border border-indigo/25 bg-indigo/5 p-4 text-left text-sm sm:text-base leading-relaxed">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-light mb-1 flex items-center gap-1.5">
            <span>💬</span> Câu ví dụ thực tế
          </div>
          <p className="italic text-foreground">&quot;{card.example}&quot;</p>
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
