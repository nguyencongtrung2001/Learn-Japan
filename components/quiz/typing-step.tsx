"use client";

import { useState } from "react";
import { QuestionPanel } from "./question-panel";
import { CorrectAnswer } from "./correct-answer";
import type { Card } from "@/db/schema";
import type { Feedback } from "@/lib/quiz";

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

  return (
    <QuestionPanel feedback={feedback} className="p-8 sm:p-12">
      <div className="mb-8 text-2xl font-extrabold sm:text-4xl">{card.translation}</div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={answered}
          autoComplete="off"
          spellCheck={false}
          placeholder="Gõ đáp án của bạn..."
          className={`w-full rounded-2xl border-2 bg-surface/50 px-6 py-5 text-center text-3xl font-bold text-foreground outline-none transition-all placeholder:text-foreground-muted/30 ${borderTone}`}
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
        <CorrectAnswer textClass="text-3xl sm:text-4xl font-bold text-foreground">{card.word}</CorrectAnswer>
      )}
    </QuestionPanel>
  );
}
