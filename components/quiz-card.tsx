"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { type KanaItem } from "@/data/kana-data";

type QuizMode = "kana-to-romaji" | "romaji-to-kana";

interface QuizCardProps {
  item: KanaItem;
  mode: QuizMode;
  onAnswer: (isCorrect: boolean) => void;
  currentIndex: number;
  totalCount: number;
}

export default function QuizCard({
  item,
  mode,
  onAnswer,
  currentIndex,
  totalCount,
}: QuizCardProps) {
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(
    null
  );
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and when item changes
  useEffect(() => {
    setUserInput("");
    setFeedback(null);
    setShowAnswer(false);
    // Small delay so the element is available after animation
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [item]);

  const checkAnswer = useCallback(() => {
    if (!userInput.trim()) return;

    const correctAnswer = mode === "kana-to-romaji" ? item.romaji : item.kana;
    const isCorrect =
      userInput.trim().toLowerCase() === correctAnswer.toLowerCase();

    setFeedback(isCorrect ? "correct" : "incorrect");
    setShowAnswer(!isCorrect);

    // Auto advance after delay
    setTimeout(
      () => {
        onAnswer(isCorrect);
      },
      isCorrect ? 800 : 2000
    );
  }, [userInput, mode, item, onAnswer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !feedback) {
        checkAnswer();
      }
    },
    [checkAnswer, feedback]
  );

  // What we display as the question
  const questionDisplay = mode === "kana-to-romaji" ? item.kana : item.romaji;
  // What the correct answer is
  const correctAnswer = mode === "kana-to-romaji" ? item.romaji : item.kana;
  // Placeholder text
  const placeholder =
    mode === "kana-to-romaji"
      ? "Nhập romaji... (ví dụ: ka)"
      : "Nhập kana... (ví dụ: か)";

  return (
    <div className="flex flex-col items-center gap-5 animate-slide-in-right" key={`${item.kana}-${currentIndex}`}>
      {/* Question counter */}
      <div className="text-foreground-dim text-sm">
        Câu{" "}
        <span className="text-indigo-light font-bold">{currentIndex + 1}</span>
        <span className="mx-1">/</span>
        <span>{totalCount}</span>
      </div>

      {/* Question card */}
      <div
        className={`
          glass-card w-72 h-72 sm:w-80 sm:h-80 flex flex-col items-center justify-center
          transition-all duration-300
          ${feedback === "correct" ? "correct-glow" : ""}
          ${feedback === "incorrect" ? "incorrect-glow animate-shake" : ""}
        `}
        id="quiz-card"
      >
        {/* Type badge */}
        <div className="absolute top-4 right-4">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              item.type === "hiragana"
                ? "bg-sakura/15 text-sakura-light"
                : "bg-indigo/15 text-indigo-light"
            }`}
          >
            {item.type === "hiragana" ? "ひらがな" : "カタカナ"}
          </span>
        </div>

        {/* Question display */}
        <span
          className={`font-bold mb-4 ${
            mode === "kana-to-romaji"
              ? "kana-display text-7xl sm:text-8xl text-foreground"
              : "text-4xl sm:text-5xl gradient-text"
          }`}
        >
          {questionDisplay}
        </span>

        {/* Mode hint */}
        <p className="text-foreground-dim text-xs">
          {mode === "kana-to-romaji"
            ? "Nhập cách đọc bằng Romaji"
            : "Nhập ký tự Kana tương ứng"}
        </p>
      </div>

      {/* Input section */}
      <div className="w-72 sm:w-80 space-y-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={!!feedback}
            className={`
              w-full px-4 py-3 rounded-xl bg-surface border text-center text-lg font-medium
              outline-none transition-all duration-300
              placeholder:text-foreground-dim/40
              ${
                feedback === "correct"
                  ? "border-emerald bg-emerald/10 text-emerald"
                  : feedback === "incorrect"
                  ? "border-rose bg-rose/10 text-rose"
                  : "border-border focus:border-indigo focus:ring-2 focus:ring-indigo/20 text-foreground"
              }
            `}
            id="quiz-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* Feedback icon */}
          {feedback && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl animate-confetti-pop">
              {feedback === "correct" ? "✅" : "❌"}
            </span>
          )}
        </div>

        {/* Submit button */}
        {!feedback && (
          <button
            onClick={checkAnswer}
            disabled={!userInput.trim()}
            className={`
              w-full py-3 rounded-xl font-semibold transition-all duration-200
              ${
                userInput.trim()
                  ? "bg-gradient-to-r from-sakura to-indigo text-white hover:shadow-lg hover:shadow-sakura/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  : "bg-surface-hover text-foreground-dim cursor-not-allowed"
              }
            `}
            id="quiz-submit-btn"
          >
            Kiểm tra
          </button>
        )}

        {/* Show answer if incorrect */}
        {showAnswer && (
          <div className="text-center p-3 rounded-xl bg-rose/10 border border-rose/20 animate-fade-in">
            <p className="text-rose/70 text-xs mb-1">Đáp án đúng:</p>
            <p className="text-2xl font-bold text-rose kana-display">
              {correctAnswer}
            </p>
          </div>
        )}

        {/* Correct feedback */}
        {feedback === "correct" && (
          <div className="text-center p-3 rounded-xl bg-emerald/10 border border-emerald/20 animate-fade-in">
            <p className="text-emerald font-semibold">
              🎉 Chính xác! Giỏi lắm!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
