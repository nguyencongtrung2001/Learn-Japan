"use client";

import { useState } from "react";
import { QuestionPanel } from "./question-panel";
import { CorrectAnswer } from "./correct-answer";
import type { Card } from "@/db/schema";
import { type Feedback, splitAnswers } from "@/lib/quiz";

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
  const answered = feedback !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || answered) return;
    onSubmit(value);
  };

  const borderTone =
    feedback === "correct"
      ? "border-emerald/50 text-emerald"
      : feedback === "incorrect"
        ? "border-rose/50 text-rose"
        : "border-border/50 focus:border-indigo focus:ring-4 focus:ring-indigo/10";

  const acceptableWords = splitAnswers(card.word);

  return (
    <QuestionPanel feedback={feedback} className="p-8 sm:p-12">
      <div className="mb-2 text-2xl font-extrabold sm:text-4xl">{card.translation}</div>
      
      {card.partOfSpeech && (
        <div className="mb-4">
          <span className="rounded-md bg-indigo/15 px-2 py-0.5 text-xs font-bold text-indigo-light uppercase tracking-wider border border-indigo/25">
            {card.partOfSpeech}
          </span>
        </div>
      )}
      {!card.partOfSpeech && <div className="mb-6" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
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

        <p className="text-center text-xs text-foreground-dim pt-1">
          💡 Chấp nhận bất kỳ đáp án nào (cách nhau bởi dấu phẩy <code>,</code> hoặc chấm phẩy <code>;</code>), không phân biệt hoa thường hay khoảng trắng.
        </p>
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
