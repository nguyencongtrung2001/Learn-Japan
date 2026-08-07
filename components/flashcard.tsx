"use client";

import { useState, useCallback } from "react";
import { type KanaItem } from "@/data/kana-data";

interface FlashcardProps {
  item: KanaItem;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalCount: number;
}

export default function Flashcard({
  item,
  onNext,
  onPrev,
  currentIndex,
  totalCount,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    // Small delay so the card flips back before showing the next character
    setTimeout(() => onNext(), 150);
  }, [onNext]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => onPrev(), 150);
  }, [onPrev]);

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      {/* Card counter */}
      <div className="text-foreground-dim text-sm">
        <span className="text-indigo-light font-bold">{currentIndex + 1}</span>
        <span className="mx-1">/</span>
        <span>{totalCount}</span>
      </div>

      {/* Flashcard */}
      <div
        className="perspective-1000 w-72 h-96 sm:w-80 sm:h-[420px] cursor-pointer select-none"
        onClick={handleFlip}
        id="flashcard"
      >
        <div className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}>
          {/* Front — Kana character */}
          <div className="flip-card-front glass-card hover:!transform-none animate-pulse-glow">
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
            <span className="kana-display text-7xl sm:text-8xl font-bold text-foreground mb-4">
              {item.kana}
            </span>
            <p className="text-foreground-dim text-sm mt-2">
              タップして答えを見る
            </p>
            <div className="absolute bottom-4 flex items-center gap-1 text-foreground-dim/50">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-xs">Nhấn để lật thẻ</span>
            </div>
          </div>

          {/* Back — Answer */}
          <div className="flip-card-back glass-card !bg-gradient-to-br from-indigo/20 to-sakura/10 hover:!transform-none">
            <div className="absolute top-4 right-4">
              <span className="text-xs px-2 py-1 rounded-full bg-emerald/15 text-emerald">
                Đáp án
              </span>
            </div>
            <span className="kana-display text-5xl sm:text-6xl font-bold text-foreground mb-3">
              {item.kana}
            </span>
            <div className="w-16 h-0.5 rounded-full bg-gradient-to-r from-sakura to-indigo mb-3" />
            <span className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
              {item.romaji}
            </span>
            <p className="text-foreground-muted text-sm mt-1">
              Phát âm:{" "}
              <span className="text-foreground font-medium">{item.romaji}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePrev}
          className="px-5 py-2.5 rounded-xl bg-surface border border-border text-foreground-muted 
                     hover:bg-surface-hover hover:text-foreground transition-all duration-200
                     hover:scale-105 active:scale-95 cursor-pointer"
          id="flashcard-prev-btn"
        >
          ← Trước
        </button>
        <button
          onClick={handleFlip}
          className="px-5 py-2.5 rounded-xl bg-indigo/15 border border-indigo/30 text-indigo-light
                     hover:bg-indigo/25 transition-all duration-200
                     hover:scale-105 active:scale-95 cursor-pointer"
          id="flashcard-flip-btn"
        >
          🔄 Lật thẻ
        </button>
        <button
          onClick={handleNext}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sakura to-indigo text-white font-medium
                     hover:shadow-lg hover:shadow-sakura/25 transition-all duration-200
                     hover:scale-105 active:scale-95 cursor-pointer"
          id="flashcard-next-btn"
        >
          Tiếp →
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="text-foreground-dim/40 text-xs text-center hidden sm:block">
        Nhấn <kbd className="px-1.5 py-0.5 rounded bg-surface-hover text-foreground-dim text-[10px]">Space</kbd> để lật · 
        <kbd className="px-1.5 py-0.5 rounded bg-surface-hover text-foreground-dim text-[10px] ml-1">←</kbd> Trước · 
        <kbd className="px-1.5 py-0.5 rounded bg-surface-hover text-foreground-dim text-[10px] ml-1">→</kbd> Tiếp
      </p>
    </div>
  );
}
