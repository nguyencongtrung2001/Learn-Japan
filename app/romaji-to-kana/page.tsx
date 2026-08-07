"use client";

import { useState, useCallback } from "react";
import { type KanaGroup, type KanaItem, getByGroup } from "@/data/kana-data";
import { shuffleArray } from "@/lib/shuffle";
import {
  useLocalStorage,
  type LearningProgress,
  defaultProgress,
} from "@/hooks/use-local-storage";
import GroupSelector from "@/components/group-selector";
import QuizCard from "@/components/quiz-card";
import ProgressBar from "@/components/progress-bar";
import StatsDisplay from "@/components/stats-display";

type Phase = "select" | "quiz" | "results";

export default function RomajiToKanaPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedGroups, setSelectedGroups] = useState<KanaGroup[]>([]);
  const [cards, setCards] = useState<KanaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);

  const [progress, setProgress] = useLocalStorage<LearningProgress>(
    "romaji-to-kana-progress",
    defaultProgress
  );

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
    setSessionCorrect(0);
    setSessionIncorrect(0);
    setPhase("quiz");
  }, [selectedGroups]);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) {
        setSessionCorrect((prev) => prev + 1);
        setProgress((prev) => ({
          ...prev,
          correct: prev.correct + 1,
          totalAttempts: prev.totalAttempts + 1,
          lastStudied: new Date().toISOString(),
        }));
      } else {
        setSessionIncorrect((prev) => prev + 1);
        setProgress((prev) => ({
          ...prev,
          incorrect: prev.incorrect + 1,
          totalAttempts: prev.totalAttempts + 1,
          lastStudied: new Date().toISOString(),
        }));
      }

      // Move to next question or show results
      if (currentIndex >= cards.length - 1) {
        setTimeout(() => setPhase("results"), isCorrect ? 1000 : 2200);
      } else {
        setTimeout(
          () => setCurrentIndex((prev) => prev + 1),
          isCorrect ? 1000 : 2200
        );
      }
    },
    [currentIndex, cards.length, setProgress]
  );

  const handleRestart = useCallback(() => {
    const shuffled = shuffleArray(cards);
    setCards(shuffled);
    setCurrentIndex(0);
    setSessionCorrect(0);
    setSessionIncorrect(0);
    setPhase("quiz");
  }, [cards]);

  const handleBackToSelect = useCallback(() => {
    setPhase("select");
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Page title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          <span className="mr-2">🔤</span>
          <span className="gradient-text">Romaji → Kana</span>
        </h1>
        <p className="text-foreground-muted text-sm">
          Xem từ Romaji và nhập ký tự Hiragana hoặc Katakana tương ứng
        </p>
      </div>

      {/* Select Phase */}
      {phase === "select" && (
        <GroupSelector
          selectedGroups={selectedGroups}
          onToggleGroup={handleToggleGroup}
          onStartStudy={handleStartStudy}
        />
      )}

      {/* Quiz Phase */}
      {phase === "quiz" && cards.length > 0 && (
        <div className="space-y-6">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToSelect}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
            >
              ← Chọn nhóm khác
            </button>
            <StatsDisplay
              correct={sessionCorrect}
              incorrect={sessionIncorrect}
              total={cards.length}
            />
          </div>

          {/* Progress */}
          <ProgressBar
            current={currentIndex + 1}
            total={cards.length}
            label="Tiến độ"
          />

          {/* Quiz Card */}
          <div className="flex justify-center">
            <QuizCard
              item={cards[currentIndex]}
              mode="romaji-to-kana"
              onAnswer={handleAnswer}
              currentIndex={currentIndex}
              totalCount={cards.length}
            />
          </div>
        </div>
      )}

      {/* Results Phase */}
      {phase === "results" && (
        <div className="text-center animate-fade-in-up">
          <div className="glass-card p-8 sm:p-10 max-w-md mx-auto mb-8">
            <div className="text-5xl mb-4">
              {sessionCorrect / (sessionCorrect + sessionIncorrect) >= 0.8
                ? "🎉"
                : sessionCorrect / (sessionCorrect + sessionIncorrect) >= 0.5
                ? "💪"
                : "📚"}
            </div>
            <h2 className="text-2xl font-bold mb-2">Hoàn thành!</h2>
            <p className="text-foreground-muted text-sm mb-6">
              {sessionCorrect / (sessionCorrect + sessionIncorrect) >= 0.8
                ? "Xuất sắc! Bạn đã ghi nhớ rất tốt!"
                : sessionCorrect / (sessionCorrect + sessionIncorrect) >= 0.5
                ? "Khá tốt! Cố gắng thêm nhé!"
                : "Hãy luyện tập thêm, bạn sẽ tiến bộ!"}
            </p>

            <StatsDisplay
              correct={sessionCorrect}
              incorrect={sessionIncorrect}
              total={sessionCorrect + sessionIncorrect}
            />

            {/* Total progress */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-foreground-dim text-xs mb-2">
                Tổng tiến độ tích lũy
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <span className="text-emerald">
                  ✓ {progress.correct} đúng
                </span>
                <span className="text-rose">✗ {progress.incorrect} sai</span>
                <span className="text-foreground-muted">
                  📝 {progress.totalAttempts} câu
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="btn-shine px-8 py-3 rounded-2xl bg-gradient-to-r from-sakura to-indigo text-white font-semibold
                         hover:shadow-xl hover:shadow-sakura/20 hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              🔄 Luyện tập lại
            </button>
            <button
              onClick={handleBackToSelect}
              className="px-6 py-3 rounded-2xl border border-border text-foreground-muted font-medium
                         hover:bg-surface-hover hover:text-foreground transition-all duration-200 cursor-pointer"
            >
              Chọn nhóm khác
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
