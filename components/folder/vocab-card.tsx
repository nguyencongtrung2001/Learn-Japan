import { memo, useEffect, useRef, useState } from "react";
import { growthIcon } from "@/lib/growth";
import type { CardListItem } from "@/lib/card-utils";

interface VocabCardProps {
  card: CardListItem;
  isDue: boolean;
  onPlay: (text: string) => void;
  onDelete: (id: number) => void;
  onEdit?: (card: CardListItem) => void;
  folderLanguage?: string;
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
  // Nếu câu ví dụ có kèm dịch trong ngoặc đơn: 春になると桜が綺麗に咲きます。(Khi mùa xuân đến...)
  const bracketMatch = sentence.match(/^([\s\S]*?)\s*[(（]([\s\S]+?)[)）]\s*$/);
  if (bracketMatch) {
    return { sentence: bracketMatch[1].trim(), meaning: bracketMatch[2].trim() };
  }
  // Nếu câu ví dụ chia thành 2 dòng (dòng 1 câu gốc, dòng 2 câu dịch)
  const lines = sentence.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    return { sentence: lines[0], meaning: lines.slice(1).join(" ") };
  }
  return { sentence, meaning: "" };
}

function VocabCardBase({ card, isDue, onPlay, onDelete, onEdit, folderLanguage = "japanese" }: VocabCardProps) {
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
  const romaji = card.romaji || card.phonetic;
  const { sentence: exampleSentence, meaning: exampleMeaning } = parseExampleAndMeaning(
    card.example,
    card.exampleMeaning
  );

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

      {/* ══════════════════════════════════════════════════════════════
          CHẾ ĐỘ 1: TRƯỚC KHI BẤM VÀO THẺ (THU GỌN / COLLAPSED)
          Hiển thị chính xác theo thứ tự:
          1. Kana
          2. Kanji (Kaji)
          3. Romaji
          4. Nghĩa
          5. Hình ảnh
         ══════════════════════════════════════════════════════════════ */}
      {!isExpanded && (
        <div className="flex flex-col gap-2 flex-1">
          {/* Header hàng 1: Kana + Kanji + Growth Level icon */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Kana */}
                <h3 className="vocab-card-v2__word text-lg font-extrabold text-foreground truncate">
                  {card.word}
                </h3>

                {/* 2. Kanji (Kaji) */}
                {card.kanji && (
                  <span
                    className="rounded-md bg-sakura/15 px-2 py-0.5 text-xs font-bold text-sakura-light border border-sakura/30 font-jp"
                    title="Chữ Hán (Kanji)"
                  >
                    Kanji: {card.kanji}
                  </span>
                )}
              </div>

              {/* 3. Romaji */}
              {romaji && (
                <span className="vocab-card-v2__phonetic text-xs font-mono font-medium">
                  /{romaji}/
                </span>
              )}
            </div>

            <span className="vocab-card-v2__growth shrink-0" title={`Level ${card.growthLevel}`}>
              {growthIcon(card.growthLevel)}
            </span>
          </div>

          {/* 4. Nghĩa */}
          <p className="vocab-card-v2__translation font-medium text-foreground/90 line-clamp-2">
            {card.translation}
          </p>

          {/* 5. Hình ảnh */}
          {card.imageUrl && (
            <div className="mt-1 w-full h-32 sm:h-36 rounded-xl overflow-hidden border border-border/60 bg-black/10 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.imageUrl}
                alt={card.word}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}

          <div className="mt-auto pt-1 flex items-center justify-end text-[11px] text-foreground-dim">
            <span className="hover:text-indigo-light transition-colors">Xem chi tiết ▼</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          CHẾ ĐỘ 2: SAU KHI BẤM VÀO THẺ (MỞ RỘNG / EXPANDED)
          Hiển thị chính xác theo thứ tự:
          1. Kana
          2. Kanji (Kaji)
          3. Loại từ
          4. Romaji
          5. Nghĩa
          6. Hình ảnh
          7. Ví dụ
          8. Có dịch nghĩa
          9. Ngữ cảnh
         ══════════════════════════════════════════════════════════════ */}
      {isExpanded && (
        <div className="vocab-card-v2__details space-y-3">
          {/* Header hàng mở rộng: Kana + Kanji + Nút thu gọn */}
          <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-2">
            <div className="min-w-0 flex-1">
              {/* 1. Kana */}
              <div className="text-xs font-bold uppercase tracking-wider text-foreground-dim mb-0.5">
                {folderLanguage === "japanese" ? "Từ vựng (Kana)" : "Từ vựng"}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-wide">
                {card.word}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="vocab-card-v2__growth" title={`Level ${card.growthLevel}`}>
                {growthIcon(card.growthLevel)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="text-xs font-bold text-[#586380] hover:text-[#4255FF] px-2 py-1 rounded-lg bg-surface hover:bg-surface-hover border border-border/50 transition-all cursor-pointer flex items-center gap-1"
                title="Thu gọn thẻ"
              >
                <span>Thu gọn</span>
                <span>▲</span>
              </button>
            </div>
          </div>

          {/* 2. Kanji (Kaji) */}
          {card.kanji && (
            <div className="rounded-xl border border-sakura/25 bg-sakura/5 p-2.5">
              <span className="vocab-card-v2__label text-sakura-light mb-1">
                🈁 Chữ Hán (Kanji)
              </span>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-foreground tracking-wide font-jp">
                  {card.kanji}
                </p>
                {card.furigana && (
                  <span className="text-xs font-medium text-sakura-light">
                    ({card.furigana})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 3. Loại từ */}
          {card.partOfSpeech && (
            <div className="flex items-center gap-2">
              <span className="vocab-card-v2__label mb-0">Loại từ:</span>
              <span className="rounded-md bg-indigo/15 px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-indigo-light border border-indigo/25">
                {card.partOfSpeech}
              </span>
            </div>
          )}

          {/* 4. Romaji */}
          {romaji && (
            <div className="flex items-center gap-2">
              <span className="vocab-card-v2__label mb-0">Romaji:</span>
              <span className="text-sm font-mono font-semibold text-indigo-light">
                /{romaji}/
              </span>
            </div>
          )}

          {/* 5. Nghĩa */}
          <div className="rounded-xl border border-border/60 bg-surface/50 p-3">
            <span className="vocab-card-v2__label mb-1">
              Nghĩa tiếng Việt
            </span>
            <p className="text-base font-bold text-foreground leading-snug">
              {card.translation}
            </p>
          </div>

          {/* 6. Hình ảnh */}
          {card.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-border/70 bg-surface/40 p-2.5">
              <span className="vocab-card-v2__label mb-1.5 flex items-center gap-1.5">
                <span>🖼️</span> Hình ảnh
              </span>
              <div className="flex justify-center max-h-56 overflow-hidden rounded-lg bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.imageUrl}
                  alt={card.word}
                  loading="lazy"
                  decoding="async"
                  className="max-h-52 w-auto object-contain rounded transition-transform hover:scale-105 duration-200"
                />
              </div>
            </div>
          )}

          {/* 7. Ví dụ */}
          {exampleSentence && (
            <div className="vocab-card-v2__example rounded-xl border border-indigo/25 bg-indigo/5 p-3">
              <span className="vocab-card-v2__label text-indigo-light mb-1 flex items-center gap-1">
                <span>💬</span> Ví dụ
              </span>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                &quot;{exampleSentence}&quot;
              </p>
            </div>
          )}

          {/* 8. Có dịch nghĩa */}
          {exampleMeaning && (
            <div className="rounded-xl border border-emerald/25 bg-emerald/5 p-3">
              <span className="vocab-card-v2__label text-emerald-light mb-1 flex items-center gap-1">
                <span>📝</span> Có dịch nghĩa
              </span>
              <p className="text-sm text-foreground/90 italic leading-relaxed">
                {exampleMeaning}
              </p>
            </div>
          )}

          {/* 9. Ngữ cảnh */}
          {card.definition && (
            <div className="vocab-card-v2__definition rounded-xl border border-border/60 bg-surface/40 p-3">
              <span className="vocab-card-v2__label mb-1 flex items-center gap-1">
                <span>💡</span> Ngữ cảnh &amp; Sắc thái
              </span>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {card.definition}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer chung của thẻ: Level & Action Buttons */}
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
