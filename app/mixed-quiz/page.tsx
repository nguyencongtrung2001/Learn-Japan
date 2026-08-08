"use client";

import { useState, useCallback, useMemo } from "react";
import { type KanaGroup, type KanaItem, getByGroup } from "@/data/kana-data";
import { shuffleArray } from "@/lib/shuffle";
import {
  useLocalStorage,
  type LearningProgress,
  defaultProgress,
} from "@/hooks/use-local-storage";
import GroupSelector from "@/components/group-selector";
import QuizCard from "@/components/quiz-card";
import StatsDisplay from "@/components/stats-display";

type Phase = "select" | "quiz" | "results";
type QuizMode = "kana-to-romaji" | "romaji-to-kana";

interface MixedQuizItem {
  item: KanaItem;
  mode: QuizMode;
}

export default function MixedQuizPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedGroups, setSelectedGroups] = useState<KanaGroup[]>([]);
  const [quizItems, setQuizItems] = useState<MixedQuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);

  const [progress, setProgress] = useLocalStorage<LearningProgress>(
    "mixed-quiz-progress",
    defaultProgress
  );

  // Current quiz item
  const currentQuizItem = useMemo(
    () => quizItems[currentIndex],
    [quizItems, currentIndex]
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

    // For each kana item, randomly assign either kana→romaji or romaji→kana mode
    const mixed: MixedQuizItem[] = items.map((item) => ({
      item,
      mode: Math.random() < 0.5 ? "kana-to-romaji" : "romaji-to-kana",
    }));

    // Shuffle the entire list
    const shuffled = shuffleArray(mixed);

    setQuizItems(shuffled);
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
      if (currentIndex >= quizItems.length - 1) {
        setTimeout(() => setPhase("results"), isCorrect ? 1000 : 2200);
      } else {
        setTimeout(
          () => setCurrentIndex((prev) => prev + 1),
          isCorrect ? 1000 : 2200
        );
      }
    },
    [currentIndex, quizItems.length, setProgress]
  );

  const handleRestart = useCallback(() => {
    // Re-randomize modes and reshuffle
    const reRandomized: MixedQuizItem[] = quizItems.map((qi) => ({
      item: qi.item,
      mode: Math.random() < 0.5 ? "kana-to-romaji" : "romaji-to-kana",
    }));
    setQuizItems(shuffleArray(reRandomized));
    setCurrentIndex(0);
    setSessionCorrect(0);
    setSessionIncorrect(0);
    setPhase("quiz");
  }, [quizItems]);

  const handleBackToSelect = useCallback(() => {
    setPhase("select");
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Page title */}
      {phase !== "quiz" && (
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="mr-2">🔀</span>
            <span className="gradient-text">Mixed Quiz</span>
          </h1>
          <p className="text-foreground-muted text-sm max-w-md mx-auto">
            Kết hợp ngẫu nhiên Kana → Romaji và Romaji → Kana trong cùng một
            bài kiểm tra
          </p>
        </div>
      )}

      {/* Select Phase */}
      {phase === "select" && (
        <GroupSelector
          selectedGroups={selectedGroups}
          onToggleGroup={handleToggleGroup}
          onStartStudy={handleStartStudy}
        />
      )}

      {/* Quiz Phase */}
      {phase === "quiz" && currentQuizItem && (
        <div className="space-y-6">
          {/* Top bar */}
          <div className="flex items-center justify-center mb-2">
            <StatsDisplay
              correct={sessionCorrect}
              incorrect={sessionIncorrect}
              total={quizItems.length}
            />
          </div>

          {/* Mode indicator — so user knows which direction this question is */}
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
                currentQuizItem.mode === "kana-to-romaji"
                  ? "bg-sakura/10 border-sakura/30 text-sakura-light"
                  : "bg-indigo/10 border-indigo/30 text-indigo-light"
              }`}
            >
              {currentQuizItem.mode === "kana-to-romaji" ? (
                <>
                  <span className="kana-display">仮名</span> → Romaji
                </>
              ) : (
                <>
                  Romaji → <span className="kana-display">仮名</span>
                </>
              )}
            </span>
          </div>

          {/* Quiz Card */}
          <div className="flex justify-center">
            <QuizCard
              item={currentQuizItem.item}
              mode={currentQuizItem.mode}
              onAnswer={handleAnswer}
              currentIndex={currentIndex}
              totalCount={quizItems.length}
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
                ? "Tuyệt vời! Bạn đã nắm vững cả hai chiều!"
                : sessionCorrect / (sessionCorrect + sessionIncorrect) >= 0.5
                ? "Khá tốt! Hãy luyện thêm để hoàn hảo!"
                : "Đừng nản, thử lại sẽ giỏi hơn thôi!"}
            </p>

            <StatsDisplay
              correct={sessionCorrect}
              incorrect={sessionIncorrect}
              total={sessionCorrect + sessionIncorrect}
            />

            {/* Total progress */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-foreground-dim text-xs mb-2">
                Tổng tiến độ tích lũy (Mixed Quiz)
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
