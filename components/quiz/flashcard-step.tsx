import { QuestionPanel } from "./question-panel";
import type { Card } from "@/db/schema";

interface FlashcardStepProps {
  card: Card;
  onPlay: (text: string) => void;
  onNext: () => void;
}

/** Tách câu ví dụ và bản dịch nghĩa của ví dụ */
function parseExampleAndMeaning(example?: string | null, exampleMeaning?: string | null) {
  const sentence = (example ?? "").trim();
  const directMeaning = (exampleMeaning ?? "").trim();
  if (directMeaning) {
    return { sentence, meaning: directMeaning };
  }
  if (!sentence) {
    return { sentence: "", meaning: "" };
  }
  const bracketMatch = sentence.match(/^([\s\S]*?)\s*[(（]([\s\S]+?)[)）]\s*$/);
  if (bracketMatch) {
    return { sentence: bracketMatch[1].trim(), meaning: bracketMatch[2].trim() };
  }
  const lines = sentence.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    return { sentence: lines[0], meaning: lines.slice(1).join(" ") };
  }
  return { sentence, meaning: "" };
}

export function FlashcardStep({ card, onPlay, onNext }: FlashcardStepProps) {
  const romaji = card.romaji || card.phonetic;
  const { sentence: exampleSentence, meaning: exampleMeaning } = parseExampleAndMeaning(
    card.example,
    card.exampleMeaning
  );

  return (
    <QuestionPanel feedback={null} className="mb-6 animate-fade-in border-t-white/10 p-6 sm:p-10">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald via-indigo to-sakura opacity-60" />

      {/* 1. Kana (kèm Kanji nếu khác và nút loa phát âm thanh) */}
      <div className="mb-2 flex items-center justify-center gap-3 flex-wrap">
        <span className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
          {card.word}
        </span>
        {card.kanji && card.kanji !== card.word && (
          <span
            className="rounded-lg bg-sakura/15 px-3 py-1 text-lg sm:text-xl font-bold text-sakura-light border border-sakura/30 font-jp"
            title="Chữ Hán (Kanji)"
          >
            {card.kanji}
          </span>
        )}
        <button
          type="button"
          onClick={() => onPlay(card.word)}
          className="p-2 rounded-xl text-[#586380] hover:text-[#4255FF] hover:bg-surface-hover border border-border/60 transition-all cursor-pointer"
          title="Nghe phát âm chuẩn"
          aria-label="Nghe phát âm"
        >
          🔊
        </button>
      </div>

      {/* 2 & 3. Loại từ & Romaji */}
      <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
        {card.partOfSpeech && (
          <span className="rounded-full bg-indigo/15 border border-indigo/30 px-3.5 py-1 text-xs sm:text-sm font-bold text-indigo-light uppercase tracking-wider">
            {card.partOfSpeech}
          </span>
        )}
        {romaji && (
          <span className="inline-block rounded-full bg-surface border border-border/80 px-3.5 py-1 text-xs sm:text-sm font-mono font-semibold text-foreground-dim">
            /{romaji}/
          </span>
        )}
      </div>

      {/* 4. Nghĩa tiếng Việt */}
      <div className="mb-5 text-3xl sm:text-4xl font-extrabold text-foreground text-center">
        {card.translation}
      </div>

      {/* 5. Hình ảnh */}
      {card.imageUrl && (
        <div className="mx-auto mb-6 flex flex-col items-center">
          <div className="max-h-60 max-w-sm overflow-hidden rounded-2xl border-2 border-indigo/20 shadow-xl bg-surface/80 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.imageUrl}
              alt={card.word}
              loading="lazy"
              decoding="async"
              className="max-h-56 w-auto object-contain rounded-xl"
            />
          </div>
          <span className="mt-1.5 text-[11px] font-semibold text-foreground-dim uppercase tracking-wider">
            🖼️ Hình ảnh minh họa
          </span>
        </div>
      )}

      {/* 6. Ví dụ */}
      {exampleSentence && (
        <div className="mb-3 rounded-2xl border border-indigo/25 bg-indigo/5 p-4 text-left leading-relaxed">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-light mb-1 flex items-center gap-1.5">
            <span>💬</span> Câu ví dụ thực tế
          </div>
          <p className="text-base font-semibold text-foreground">&quot;{exampleSentence}&quot;</p>
        </div>
      )}

      {/* 7. Có dịch nghĩa */}
      {exampleMeaning && (
        <div className="mb-4 rounded-2xl border border-emerald/25 bg-emerald/5 p-4 text-left leading-relaxed">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-light mb-1 flex items-center gap-1.5">
            <span>📝</span> Có dịch nghĩa
          </div>
          <p className="text-sm sm:text-base text-foreground/90 italic">{exampleMeaning}</p>
        </div>
      )}

      {/* 8. Ngữ cảnh & Sắc thái */}
      {card.definition && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-surface/40 p-4 text-left text-sm text-foreground-muted sm:text-base leading-relaxed">
          <div className="text-xs font-bold uppercase tracking-wider text-foreground-dim mb-1 flex items-center gap-1.5">
            <span>💡</span> Ngữ cảnh &amp; Sắc thái
          </div>
          <p className="text-foreground">{card.definition}</p>
        </div>
      )}

      {/* 9. Loa phát âm thanh & Nút xác nhận tiếp tục */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
