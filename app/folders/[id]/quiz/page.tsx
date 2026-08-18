"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCardsByFolder } from "@/actions/card-actions";
import { updateSRS } from "@/actions/card-actions";
import { shuffleArray } from "@/lib/shuffle";
import type { Card } from "@/db/schema";

type QuizType = "abcd" | "jp-to-vn" | "vn-to-jp";
type Phase = "loading" | "quiz" | "results";

interface QuizItem {
  card: Card;
  type: QuizType;
  options?: string[]; // For ABCD mode
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;

  const [phase, setPhase] = useState<Phase>("loading");
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);
  const [isHintUsed, setIsHintUsed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load cards and build quiz
  const loadQuiz = useCallback(async () => {
    const cards = await getCardsByFolder(folderId);
    if (cards.length < 4) {
      alert("Cần ít nhất 4 thẻ để bắt đầu quiz!");
      router.push(`/folders/${folderId}`);
      return;
    }

    setAllCards(cards);

    // Filter due cards, fallback to all if less than 4
    let dueCards = cards.filter((c) => new Date(c.nextReview) <= new Date());
    if (dueCards.length < 4) dueCards = cards;

    // Build quiz items with random types
    const quizTypes: QuizType[] = ["abcd", "jp-to-vn", "vn-to-jp"];
    const items: QuizItem[] = shuffleArray(dueCards).map((card) => {
      const type = quizTypes[Math.floor(Math.random() * quizTypes.length)];
      let options: string[] | undefined;

      if (type === "abcd") {
        // Generate 3 wrong options + 1 correct
        const isJpQuestion = Math.random() < 0.5;
        const correctAnswer = isJpQuestion ? card.meaning : (card.kanji || card.kana);
        const otherCards = cards.filter((c) => c.id !== card.id);
        const wrongAnswers = shuffleArray(otherCards)
          .slice(0, 3)
          .map((c) => (isJpQuestion ? c.meaning : (c.kanji || c.kana)));
        options = shuffleArray([correctAnswer, ...wrongAnswers]);
      }

      return { card, type, options };
    });

    setQuizItems(items);
    setCurrentIndex(0);
    setSessionCorrect(0);
    setSessionIncorrect(0);
    setPhase("quiz");
  }, [folderId, router]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  // Focus input when question changes
  useEffect(() => {
    if (phase === "quiz" && quizItems[currentIndex]?.type !== "abcd") {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [currentIndex, phase, quizItems]);

  // Reset state for new question
  useEffect(() => {
    setUserInput("");
    setSelectedOption(null);
    setFeedback(null);
    setShowAnswer(false);
    setIsHintUsed(false);
  }, [currentIndex]);

  const currentItem = quizItems[currentIndex];

  const playAudio = (text: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=ja`);
    audioRef.current = audio;
    audio.play();
  };

  const handleAnswer = useCallback(
    async (isCorrect: boolean) => {
      setFeedback(isCorrect ? "correct" : "incorrect");
      setShowAnswer(!isCorrect);

      if (isCorrect) {
        setSessionCorrect((p) => p + 1);
        await updateSRS(currentItem.card.id, 4); // good
      } else {
        setSessionIncorrect((p) => p + 1);
        await updateSRS(currentItem.card.id, 1); // wrong

        // Re-insert incorrect card 2 times at random positions
        setQuizItems((prev) => {
          const newItems = [...prev];
          for (let i = 0; i < 2; i++) {
            const insertAt =
              Math.floor(Math.random() * (newItems.length - currentIndex)) +
              currentIndex + 1;
            newItems.splice(insertAt, 0, currentItem);
          }
          return newItems;
        });
      }

      // Advance
      const delay = isCorrect ? 1000 : 2200;
      const totalAfter = isCorrect ? quizItems.length : quizItems.length + 2;
      setTimeout(() => {
        if (currentIndex >= totalAfter - 1) {
          setPhase("results");
        } else {
          setCurrentIndex((p) => p + 1);
        }
      }, delay);
    },
    [currentItem, currentIndex, quizItems.length]
  );

  // ── ABCD check ──
  const handleOptionSelect = (option: string) => {
    if (feedback) return;
    setSelectedOption(option);
    const item = currentItem;
    const isJpQuestion = item.options?.includes(item.card.meaning);
    const correct = isJpQuestion ? item.card.meaning : (item.card.kanji || item.card.kana);
    handleAnswer(option === correct);
  };

  // ── Text input check ──
  const handleTextSubmit = () => {
    if (!userInput.trim() || feedback) return;
    const item = currentItem;
    let correct: string;

    if (item.type === "jp-to-vn") {
      correct = item.card.meaning;
    } else {
      // vn-to-jp: accept kana, kanji, or romaji
      const answer = userInput.trim().toLowerCase();
      const isCorrect =
        answer === item.card.kana.toLowerCase() ||
        answer === (item.card.kanji || "").toLowerCase() ||
        answer === item.card.romaji.toLowerCase();
      handleAnswer(isCorrect);
      return;
    }

    const isCorrect = userInput.trim().toLowerCase() === correct.toLowerCase();
    handleAnswer(isCorrect);
  };

  if (phase === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="inline-block w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "results") {
    const accuracy = sessionCorrect + sessionIncorrect > 0
      ? Math.round((sessionCorrect / (sessionCorrect + sessionIncorrect)) * 100) : 0;
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center animate-fade-in-up">
        <div className="glass-card p-8 sm:p-10 mb-8">
          <div className="text-5xl mb-4">{accuracy >= 80 ? "🎉" : accuracy >= 50 ? "💪" : "📚"}</div>
          <h2 className="text-2xl font-bold mb-2">Hoàn thành!</h2>
          <p className="text-foreground-muted text-sm mb-6">
            {accuracy >= 80 ? "Tuyệt vời! Bạn đã nắm rất vững!" :
             accuracy >= 50 ? "Khá tốt! Hãy tiếp tục luyện tập!" :
             "Đừng nản, luyện thêm sẽ giỏi hơn!"}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="px-4 py-2 rounded-xl bg-emerald/10 border border-emerald/20">
              <div className="text-emerald font-bold text-lg">{sessionCorrect}</div>
              <div className="text-emerald/60 text-[10px] uppercase">Đúng</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-rose/10 border border-rose/20">
              <div className="text-rose font-bold text-lg">{sessionIncorrect}</div>
              <div className="text-rose/60 text-[10px] uppercase">Sai</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/20">
              <div className="text-gold font-bold text-lg">{accuracy}%</div>
              <div className="text-gold/60 text-[10px] uppercase">Chính xác</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => loadQuiz()}
            className="btn-shine px-8 py-3 rounded-2xl bg-gradient-to-r from-sakura to-indigo text-white font-semibold
                       hover:shadow-xl hover:shadow-sakura/20 hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            🔄 Luyện tập lại
          </button>
          <button
            onClick={() => router.push(`/folders/${folderId}`)}
            className="px-6 py-3 rounded-2xl border border-border text-foreground-muted font-medium
                       hover:bg-surface-hover hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz Phase ──
  if (!currentItem) return null;

  const card = currentItem.card;
  const questionText =
    currentItem.type === "vn-to-jp" ? card.meaning : (card.kanji || card.kana);
  const correctAnswer =
    currentItem.type === "jp-to-vn" ? card.meaning :
    currentItem.type === "vn-to-jp" ? card.kana : "";
  const hintText = correctAnswer ? correctAnswer.charAt(0) + "..." : "";

  // For ABCD, determine if the question shows Japanese
  const abcdIsJpQuestion = currentItem.type === "abcd" && currentItem.options?.includes(card.meaning);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Counter */}
      <div className="text-center text-foreground-dim text-sm mb-6">
        Câu <span className="text-indigo-light font-bold">{currentIndex + 1}</span>
        <span className="mx-1">/</span>
        <span>{quizItems.length}</span>
      </div>

      {/* Type badge */}
      <div className="flex justify-center mb-4">
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border ${
          currentItem.type === "abcd"
            ? "bg-gold/10 border-gold/30 text-gold"
            : currentItem.type === "jp-to-vn"
            ? "bg-sakura/10 border-sakura/30 text-sakura-light"
            : "bg-indigo/10 border-indigo/30 text-indigo-light"
        }`}>
          {currentItem.type === "abcd" ? "🅰️ Trắc nghiệm ABCD" :
           currentItem.type === "jp-to-vn" ? "🇯🇵 → 🇻🇳 Nhập nghĩa" :
           "🇻🇳 → 🇯🇵 Nhập tiếng Nhật"}
        </span>
      </div>

      {/* Question card */}
      <div
        className={`glass-card w-full max-w-sm mx-auto p-8 text-center mb-6 transition-all duration-300 ${
          feedback === "correct" ? "correct-glow" : ""
        } ${feedback === "incorrect" ? "incorrect-glow animate-shake" : ""}`}
        key={`quiz-${currentIndex}`}
      >
        {/* Image */}
        {card.imageUrl && (
          <div className="w-20 h-20 rounded-xl overflow-hidden mx-auto mb-4 border border-border/50">
            <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Question text */}
        <span className={`font-bold block mb-3 ${
          currentItem.type === "vn-to-jp"
            ? "text-2xl sm:text-3xl text-foreground"
            : "kana-display text-5xl sm:text-6xl text-foreground"
        }`}>
          {currentItem.type === "abcd" ? (abcdIsJpQuestion ? (card.kanji || card.kana) : card.meaning) : questionText}
        </span>

        {/* Sub info */}
        {currentItem.type !== "vn-to-jp" && card.kanji && (
          <p className="text-foreground-muted text-sm kana-display">{card.kana} [{card.romaji}]</p>
        )}

        {/* Audio button */}
        <button
          onClick={() => playAudio(card.kanji || card.kana)}
          className="mt-3 p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer text-xl"
        >
          🔊
        </button>

        <p className="text-foreground-dim text-xs mt-2">
          {currentItem.type === "abcd" ? "Chọn đáp án đúng" :
           currentItem.type === "jp-to-vn" ? "Nhập nghĩa tiếng Việt" :
           "Nhập Kana hoặc Romaji"}
        </p>
      </div>

      {/* Answer section */}
      <div className="w-full max-w-sm mx-auto space-y-3">
        {/* ABCD Options */}
        {currentItem.type === "abcd" && currentItem.options && (
          <div className="grid grid-cols-1 gap-2">
            {currentItem.options.map((option, i) => {
              const correct = abcdIsJpQuestion ? card.meaning : (card.kanji || card.kana);
              const isSelected = selectedOption === option;
              const isCorrectOption = option === correct;
              let optionClass = "glass-card p-3 text-center cursor-pointer hover:scale-[1.02] transition-all duration-200 text-sm font-medium";

              if (feedback) {
                if (isCorrectOption) optionClass += " !border-emerald !bg-emerald/10 text-emerald";
                else if (isSelected && !isCorrectOption) optionClass += " !border-rose !bg-rose/10 text-rose";
                else optionClass += " opacity-50";
              } else {
                optionClass += " hover:border-indigo/50";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleOptionSelect(option)}
                  disabled={!!feedback}
                  className={optionClass}
                >
                  <span className="text-foreground-dim mr-2 text-xs">{String.fromCharCode(65 + i)}.</span>
                  <span className={option === (card.kanji || card.kana) || (option !== card.meaning && allCards.some(c => (c.kanji || c.kana) === option)) ? "kana-display" : ""}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Text input mode */}
        {currentItem.type !== "abcd" && (
          <>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !feedback) handleTextSubmit(); }}
                placeholder={currentItem.type === "jp-to-vn" ? "Nhập nghĩa tiếng Việt..." : "Nhập Kana hoặc Romaji..."}
                disabled={!!feedback}
                className={`w-full px-4 py-3 rounded-xl bg-surface border text-center text-lg font-medium
                  outline-none transition-all duration-300 placeholder:text-foreground-dim/40 ${
                    feedback === "correct" ? "border-emerald bg-emerald/10 text-emerald" :
                    feedback === "incorrect" ? "border-rose bg-rose/10 text-rose" :
                    "border-border focus:border-indigo focus:ring-2 focus:ring-indigo/20 text-foreground"
                  } ${currentItem.type === "vn-to-jp" ? "kana-display" : ""}`}
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
              />
              {feedback && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl animate-confetti-pop">
                  {feedback === "correct" ? "✅" : "❌"}
                </span>
              )}
            </div>

            {/* Submit + Hint */}
            {!feedback && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleTextSubmit}
                  disabled={!userInput.trim()}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                    userInput.trim()
                      ? "bg-gradient-to-r from-sakura to-indigo text-white hover:shadow-lg hover:shadow-sakura/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      : "bg-surface-hover text-foreground-dim cursor-not-allowed"
                  }`}
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
                    <span className="font-medium text-indigo-light text-lg">{hintText}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Show correct answer */}
        {showAnswer && (
          <div className="text-center p-3 rounded-xl bg-rose/10 border border-rose/20 animate-fade-in">
            <p className="text-rose/70 text-xs mb-1">Đáp án đúng:</p>
            <p className="text-xl font-bold text-rose kana-display">{correctAnswer || card.meaning}</p>
            {card.usage && (
              <p className="text-rose/50 text-xs mt-2 italic">💬 {card.usage}</p>
            )}
          </div>
        )}

        {feedback === "correct" && (
          <div className="text-center p-3 rounded-xl bg-emerald/10 border border-emerald/20 animate-fade-in">
            <p className="text-emerald font-semibold">🎉 Chính xác!</p>
          </div>
        )}
      </div>
    </div>
  );
}
