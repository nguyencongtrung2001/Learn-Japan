"use client";

import { useMemo, useRef, useState } from "react";
import { QuestionPanel } from "./question-panel";
import { CorrectAnswer } from "./correct-answer";
import type { Card } from "@/db/schema";
import { type Feedback, generateWordHint, splitAnswers } from "@/lib/quiz";

interface TypingStepProps {
  card: Card;
  feedback: Feedback;
  onSubmit: (value: string) => void;
}

/**
 * State của ô nhập nằm trong component; cha gắn `key={item.uid}` nên mỗi câu hỏi
 * mount mới → tự reset + autoFocus (không cần useEffect/setTimeout để focus).
 */
export function TypingStep({ card, feedback, onSubmit }: TypingStepProps) {
  const [value, setValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [revealLevel, setRevealLevel] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const answered = feedback !== null;

  const hintData = useMemo(
    () => generateWordHint(card.word, revealLevel),
    [card.word, revealLevel]
  );

  const hasMoreLettersToReveal = useMemo(
    () => hintData.words.some((w) => w.chars.some((c) => !c.isPunctuation && !c.isRevealed)),
    [hintData]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || answered) return;
    onSubmit(value);
  };

  const handleToggleHint = () => {
    setShowHint((prev) => !prev);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleRevealMore = () => {
    setRevealLevel((l) => l + 1);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const borderTone =
    feedback === "correct"
      ? "border-emerald/50 text-emerald"
      : feedback === "incorrect"
        ? "border-rose/50 text-rose"
        : "border-border/50 focus:border-indigo focus:ring-4 focus:ring-indigo/10";

  const acceptableWords = splitAnswers(card.word);

  return (
    <QuestionPanel feedback={feedback} className="max-w-xl p-5 sm:p-8">
      <div className="mb-2 text-2xl font-extrabold sm:text-4xl">{card.translation}</div>

      {card.partOfSpeech && (
        <div className="mb-3">
          <span className="rounded-md bg-indigo/15 px-2 py-0.5 text-xs font-bold text-indigo-light uppercase tracking-wider border border-indigo/25">
            {card.partOfSpeech}
          </span>
        </div>
      )}
      {!card.partOfSpeech && <div className="mb-3" />}

      {/* Nút bấm gợi ý và Bảng hiển thị gợi ý */}
      {!answered && (
        <div className="mb-6 w-full">
          {!showHint ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleToggleHint}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-500/60 bg-amber-100 dark:bg-amber-950/40 px-4 py-2 text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200 transition-all hover:bg-amber-200 dark:hover:bg-amber-900/50 active:scale-95 cursor-pointer shadow-sm hover:shadow-amber-500/20"
              >
                <span className="text-base">💡</span>
                <span>
                  Gợi ý từ ({hintData.wordCount} từ · {hintData.hintedLettersCount} chữ)
                </span>
              </button>
            </div>
          ) : (
            <div className="w-full rounded-2xl border-2 border-amber-500/50 bg-amber-50/95 dark:bg-amber-950/40 p-3 sm:p-4 text-center shadow-lg shadow-amber-500/10 animate-fade-in-up">
              {/* Header gợi ý */}
              <div className="mb-2.5 flex items-center justify-between gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100">
                  <span className="text-base">💡</span>
                  <span>Gợi ý {hintData.wordCount} từ:</span>
                  <span className="rounded-lg bg-amber-300 dark:bg-amber-400 px-2 py-0.5 tracking-wider text-neutral-950 uppercase font-mono font-black border border-amber-500 shadow-xs text-xs sm:text-sm">
                    {hintData.initialsText}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  {hasMoreLettersToReveal && (
                    <button
                      type="button"
                      onClick={handleRevealMore}
                      className="cursor-pointer rounded-lg border-2 border-amber-600/50 bg-amber-300 dark:bg-amber-400 px-2.5 py-1 text-xs font-black text-neutral-950 hover:bg-amber-400 dark:hover:bg-amber-300 active:scale-95 transition-all shadow-xs"
                      title="Mở thêm chữ cái"
                    >
                      + Thêm chữ
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowHint(false)}
                    className="cursor-pointer rounded-lg px-2 py-1 text-xs font-black text-foreground-muted hover:text-foreground hover:bg-surface/70 transition-colors"
                    title="Ẩn gợi ý"
                  >
                    Ẩn ✕
                  </button>
                </div>
              </div>

              {/* Các ô ký tự gợi ý theo từng từ */}
              <div className="my-2.5 flex flex-wrap justify-center items-center gap-2 sm:gap-3 select-none w-full max-w-full overflow-x-auto py-1 px-0.5 scrollbar-none">
                {hintData.words.map((w, wIdx) => (
                  <div key={wIdx} className="flex items-center gap-1 sm:gap-1.5 flex-nowrap shrink-0">
                    {w.chars.map((c, cIdx) => {
                      if (c.isPunctuation) {
                        return (
                          <span
                            key={cIdx}
                            className="self-center px-0.5 text-base sm:text-lg font-black text-foreground shrink-0"
                          >
                            {c.char}
                          </span>
                        );
                      }
                      if (c.isRevealed) {
                        return (
                          <span
                            key={cIdx}
                            className="inline-flex h-8 w-6 sm:h-10 sm:w-8 md:h-11 md:w-9 items-center justify-center rounded-lg sm:rounded-xl border-2 border-amber-500 bg-amber-300 dark:bg-amber-400 text-sm sm:text-lg md:text-xl font-black uppercase text-neutral-950 shadow-md shrink-0"
                          >
                            {c.char}
                          </span>
                        );
                      }
                      return (
                        <span
                          key={cIdx}
                          className="inline-flex h-8 w-6 sm:h-10 sm:w-8 md:h-11 md:w-9 items-center justify-center rounded-lg sm:rounded-xl border-2 border-dashed border-border-light bg-surface text-sm sm:text-lg md:text-xl font-black text-foreground-muted shrink-0"
                        >
                          _
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Đáp án thay thế nếu có */}
              {hintData.alternatives.length > 0 && (
                <div className="mt-3 pt-2 border-t border-amber-500/30 text-center text-xs text-foreground">
                  <span className="font-black text-amber-950 dark:text-amber-200">Hoặc đáp án khác: </span>
                  {hintData.alternatives.map((alt, aIdx) => (
                    <span key={aIdx} className="font-mono text-amber-950 dark:text-amber-100 font-bold ml-1.5">
                      {alt.displayText} <span className="text-foreground-muted font-normal">({alt.initialsText})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          ref={inputRef}
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={answered}
          autoComplete="off"
          spellCheck={false}
          placeholder="Gõ đáp án của bạn (chỉ cần 1 đáp án)..."
          className={`w-full rounded-2xl border-2 bg-surface/50 px-6 py-5 text-center text-2xl sm:text-3xl font-bold text-foreground outline-none transition-all placeholder:text-foreground-muted/30 ${borderTone}`}
        />
        <button
          type="submit"
          disabled={!value.trim() || answered}
          className="w-full cursor-pointer rounded-2xl bg-indigo py-4 text-lg font-bold text-white transition-all hover:bg-indigo-light hover:shadow-lg hover:shadow-indigo/20 disabled:opacity-50 disabled:hover:shadow-none"
        >
          Kiểm tra
        </button>
      </form>

      {feedback === "incorrect" && (
        <CorrectAnswer textClass="text-2xl sm:text-3xl font-bold text-foreground">
          <div>{card.word}</div>
          {acceptableWords.length > 1 && (
            <div className="mt-1.5 text-xs font-normal text-foreground-muted">
              Chấp nhận bất kỳ đáp án nào:{" "}
              <span className="font-semibold text-foreground">
                {acceptableWords.join("  |  ")}
              </span>
            </div>
          )}
        </CorrectAnswer>
      )}
    </QuestionPanel>
  );
}
