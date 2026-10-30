"use client";

import { useQuizSession } from "@/hooks/use-quiz-session";
import type { Card } from "@/db/schema";
import { QuizSelectMode } from "./quiz-select-mode";
import { QuizResults } from "./quiz-results";
import { QuizTopBar } from "./quiz-top-bar";
import { LevelBadge } from "./level-badge";
import { FlashcardStep } from "./flashcard-step";
import { ChoiceStep } from "./choice-step";
import { TypingStep } from "./typing-step";

interface QuizSessionProps {
  folderId: number;
  initialCards: Card[];
  serverNow: number;
  initialMode?: string;
}

/** Điều phối các màn: chọn chế độ → câu hỏi → kết quả. Logic nằm trong useQuizSession. */
export default function QuizSession({ folderId, initialCards, serverNow, initialMode }: QuizSessionProps) {
  const quiz = useQuizSession(folderId, initialCards, serverNow);
  const { phase, currentItem, feedback } = quiz;

  if (phase === "select-mode") {
    return (
      <QuizSelectMode
        newCount={quiz.counts.newCount}
        dueCount={quiz.counts.dueCount}
        learnedCount={quiz.counts.learnedCount}
        onStartLearn={quiz.startLearn}
        onStartReview={quiz.startReview}
        onBack={quiz.goToFolder}
        initialMode={initialMode}
      />
    );
  }

  if (phase === "results") {
    return (
      <QuizResults
        correct={quiz.stats.correct}
        incorrect={quiz.stats.incorrect}
        completedWords={quiz.stats.completed}
        onContinue={quiz.refresh}
        onBack={quiz.goToFolder}
      />
    );
  }

  if (!currentItem) return null;

  const { card } = currentItem.word;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6 transition-all duration-300">
      <QuizTopBar
        phase={phase}
        levels={quiz.levels}
        reviewPosition={quiz.reviewPosition}
        onExit={quiz.exit}
      />
      <LevelBadge levelType={currentItem.levelType} isRetry={currentItem.isRetry} />

      {/* key={uid}: mỗi câu hỏi mount mới → ô nhập tự reset & autoFocus */}
      {currentItem.levelType === "flashcard" && (
        <FlashcardStep key={currentItem.uid} card={card} onPlay={quiz.playAudio} onNext={quiz.continueFlashcard} />
      )}

      {(currentItem.levelType === "abcd-en-vn" ||
        currentItem.levelType === "abcd-vn-en" ||
        currentItem.levelType === "audio-select") && (
        <ChoiceStep
          key={currentItem.uid}
          item={currentItem}
          feedback={feedback}
          selectedOption={quiz.selectedOption}
          onSelect={quiz.selectOption}
          onPlay={quiz.playAudio}
        />
      )}

      {currentItem.levelType === "typing" && (
        <TypingStep key={currentItem.uid} card={card} feedback={feedback} onSubmit={quiz.submitTyping} />
      )}
    </div>
  );
}
