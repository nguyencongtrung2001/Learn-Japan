"use client";

import { useState } from "react";
import { QuestionPanel } from "./question-panel";
import { CorrectAnswer } from "./correct-answer";
import type { Card } from "@/db/schema";
import type { Feedback } from "@/lib/quiz";

interface SentenceStepProps {
  card: Card;
  feedback: Feedback;
  onSubmit: (value: string) => void;
}

export function SentenceStep({ card, feedback, onSubmit }: SentenceStepProps) {
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
      <div className="mb-3 text-3xl font-extrabold tracking-tight sm:text-5xl">{card.word}</div>
      <div className="mb-6 text-base font-medium text-foreground-dim sm:text-lg">({card.translation})</div>

      <p className="mb-6 rounded-lg border border-border/50 bg-surface/50 p-3 text-sm text-foreground-muted sm:text-base">
        Hãy viết một câu tiếng Anh có chứa từ này.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={answered}
          rows={3}
          autoComplete="off"
          spellCheck={false}
          placeholder="VD: I want to eat an apple."
          className={`w-full resize-none rounded-2xl border-2 bg-surface/50 px-5 py-4 text-center text-lg font-medium text-foreground outline-none transition-all placeholder:text-foreground-muted/30 sm:text-xl ${borderTone}`}
        />
        <button
          type="submit"
          disabled={!value.trim() || answered}
          className="w-full cursor-pointer rounded-2xl bg-rose py-4 text-lg font-bold text-white transition-all hover:bg-rose/80 hover:shadow-lg hover:shadow-rose/20 disabled:opacity-50 disabled:hover:shadow-none"
        >
          Kiểm tra
        </button>
      </form>

      {feedback === "incorrect" && (
        <CorrectAnswer label="Gợi ý:" textClass="text-base sm:text-lg text-foreground-muted">
          Câu của bạn cần chứa chính xác từ <strong className="font-bold text-foreground">{card.word}</strong>.
        </CorrectAnswer>
      )}
    </QuestionPanel>
  );
}
