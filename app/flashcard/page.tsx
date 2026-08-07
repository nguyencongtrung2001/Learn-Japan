"use client";

import { useState, useCallback, useEffect } from "react";
import { type KanaGroup, type KanaItem, getByGroup } from "@/data/kana-data";
import { shuffleArray } from "@/lib/shuffle";
import GroupSelector from "@/components/group-selector";
import Flashcard from "@/components/flashcard";
import ProgressBar from "@/components/progress-bar";

type Phase = "select" | "study";

export default function FlashcardPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedGroups, setSelectedGroups] = useState<KanaGroup[]>([]);
  const [cards, setCards] = useState<KanaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [round, setRound] = useState(1);

  const handleToggleGroup = useCallback((group: KanaGroup) => {
    setSelectedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group]
    );
  }, []);

  const handleStartStudy = useCallback(() => {
    const items = getByGroup(selectedGroups);
    const shuffled = shuffleArray(items);
    setCards(shuffled);
    setCurrentIndex(0);
    setRound(1);
    setPhase("study");
  }, [selectedGroups]);

  const handleNext = useCallback(() => {
    if (currentIndex >= cards.length - 1) {
      // End of round — reshuffle and start again
      setCards(shuffleArray(cards));
      setCurrentIndex(0);
      setRound((prev) => prev + 1);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, cards]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleBackToSelect = useCallback(() => {
    setPhase("select");
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (phase !== "study") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, handleNext, handlePrev]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Page title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          <span className="mr-2">🃏</span>
          <span className="gradient-text">Flashcard</span>
        </h1>
        <p className="text-foreground-muted text-sm">
          Lật thẻ để ghi nhớ ký tự Kana và cách đọc Romaji
        </p>
      </div>

      {phase === "select" && (
        <GroupSelector
          selectedGroups={selectedGroups}
          onToggleGroup={handleToggleGroup}
          onStartStudy={handleStartStudy}
        />
      )}

      {phase === "study" && cards.length > 0 && (
        <div className="space-y-6">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToSelect}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
              id="back-to-select-btn"
            >
              ← Chọn nhóm khác
            </button>
            <span className="text-xs text-foreground-dim px-3 py-1 rounded-full bg-surface-hover">
              Lượt {round}
            </span>
          </div>

          {/* Progress */}
          <ProgressBar
            current={currentIndex + 1}
            total={cards.length}
            label="Tiến độ"
          />

          {/* Flashcard */}
          <Flashcard
            item={cards[currentIndex]}
            onNext={handleNext}
            onPrev={handlePrev}
            currentIndex={currentIndex}
            totalCount={cards.length}
          />
        </div>
      )}
    </div>
  );
}
