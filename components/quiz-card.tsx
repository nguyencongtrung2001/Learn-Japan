"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { type KanaItem } from "@/data/kana-data";
import DrawingCanvas from "./drawing-canvas";

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
  const [isHintUsed, setIsHintUsed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDrawingMode = mode === "romaji-to-kana";

  // Focus input on mount and when item/index changes (only for text-input mode)
  useEffect(() => {
    setUserInput("");
    setFeedback(null);
    setShowAnswer(false);
    setIsHintUsed(false);
    if (!isDrawingMode) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [item, isDrawingMode, currentIndex]);

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

  const handleCharacterSelected = useCallback((char: string) => {
    setUserInput(char);
  }, []);

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

      {/* Main content area (splits to side-by-side on laptop for drawing mode) */}
      <div className={`flex flex-col ${isDrawingMode ? "lg:flex-row lg:items-start" : ""} items-center justify-center gap-5 lg:gap-8 w-full max-w-4xl`}>
        
        {/* Question card */}
        <div
          className={`
            glass-card w-72 sm:w-80 flex flex-col items-center justify-center
            transition-all duration-300 shrink-0
            ${isDrawingMode ? "h-32 sm:h-36 lg:h-[280px]" : "h-72 sm:h-80"}
            ${feedback === "correct" ? "correct-glow" : ""}
            ${feedback === "incorrect" ? "incorrect-glow animate-shake" : ""}
          `}
          id="quiz-card"
        >
          {/* Question display */}
          <span
            className={`font-bold ${
              isDrawingMode ? "mb-1 lg:mb-4" : "mb-4"
            } ${
              mode === "kana-to-romaji"
                ? "kana-display text-7xl sm:text-8xl text-foreground"
                : "text-4xl sm:text-5xl lg:text-6xl gradient-text"
            }`}
          >
            {questionDisplay}
          </span>

          {/* Mode hint */}
          <p className="text-foreground-dim text-xs">
            {mode === "kana-to-romaji"
              ? "Nhập cách đọc bằng Romaji"
              : "Vẽ ký tự Kana tương ứng"}
          </p>
        </div>

        {/* Input section */}
        <div className={`w-72 sm:w-80 space-y-3 shrink-0 ${isDrawingMode ? "lg:w-[280px]" : ""}`}>
        {/* Text input — for kana-to-romaji mode */}
        {!isDrawingMode && (
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
        )}

        {/* Drawing canvas — for romaji-to-kana mode */}
        {isDrawingMode && (
          <DrawingCanvas
            key={`draw-${item.kana}-${currentIndex}`}
            onCharacterSelected={handleCharacterSelected}
            selectedChar={userInput}
            disabled={!!feedback}
          />
        )}

        {/* Selected answer display — for drawing mode */}
        {isDrawingMode && userInput && (
          <div
            className={`text-center p-3 rounded-xl border transition-all duration-300 ${
              feedback === "correct"
                ? "bg-emerald/10 border-emerald/30"
                : feedback === "incorrect"
                ? "bg-rose/10 border-rose/30"
                : "bg-surface border-border"
            }`}
            id="selected-answer"
          >
            <span className="text-xs text-foreground-dim block mb-1">
              Đã chọn:
            </span>
            <span
              className={`kana-display text-3xl font-bold ${
                feedback === "correct"
                  ? "text-emerald"
                  : feedback === "incorrect"
                  ? "text-rose"
                  : "text-indigo-light"
              }`}
            >
              {userInput}
            </span>
            {feedback && (
              <span className="ml-2 text-xl animate-confetti-pop inline-block">
                {feedback === "correct" ? "✅" : "❌"}
              </span>
            )}
          </div>
        )}

        {/* Submit & Hint buttons */}
        {!feedback && (
          <div className="flex flex-col gap-3">
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
            
            {!isHintUsed ? (
              <button
                onClick={() => setIsHintUsed(true)}
                className="text-sm text-foreground-dim hover:text-indigo transition-colors py-1 cursor-pointer"
              >
                💡 Xem gợi ý
              </button>
            ) : (
              <div className="text-center p-2 rounded-lg bg-surface border border-border/50 animate-fade-in">
                <span className="text-xs text-foreground-muted block mb-1">Gợi ý:</span>
                <span className="font-medium text-indigo-light kana-display text-lg">
                  {correctAnswer.charAt(0)}...
                </span>
              </div>
            )}
          </div>
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
  </div>
);
}
