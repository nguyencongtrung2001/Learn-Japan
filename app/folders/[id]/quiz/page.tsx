"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  getCardsByFolder,
  getNewCards,
  getReviewCards,
  updateGrowthLevel,
  updateSRS,
} from "@/actions/card-actions";
import { getFolderById } from "@/actions/folder-actions";
import { shuffleArray } from "@/lib/shuffle";
import type { Card, Folder } from "@/db/schema";

// ─── Types ───────────────────────────────────────────────────────
type Phase = "loading" | "select-mode" | "learn" | "review" | "results";
type LevelType =
  | "flashcard"      // 0→1
  | "abcd-en-vn"     // 1→2
  | "audio-select"   // 2→3
  | "abcd-vn-en"     // 3→4
  | "typing"         // 4→5
  | "sentence";      // 5→6

interface SessionWord {
  card: Card;
  sessionLevel: number;
}

interface QuizItem {
  word: SessionWord;
  levelType: LevelType;
  options?: string[];
}

function getLevelType(level: number): LevelType {
  switch (level) {
    case 0: return "flashcard";
    case 1: return "abcd-en-vn";
    case 2: return "audio-select";
    case 3: return "abcd-vn-en";
    case 4: return "typing";
    case 5: return "sentence";
    default: return "sentence";
  }
}

function getGrowthIcon(level: number): string {
  const icons = ["🌰", "🌱", "🪴", "☘️", "🌿", "🌷", "🌺"];
  return icons[Math.min(level, 6)];
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const folderId = parseInt(unwrappedParams.id, 10);

  // ── State ──
  const [folder, setFolder] = useState<Folder | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);

  // Learn mode
  const [sessionBatch, setSessionBatch] = useState<SessionWord[]>([]);
  const [quizQueue, setQuizQueue] = useState<QuizItem[]>([]);
  const [currentItem, setCurrentItem] = useState<QuizItem | null>(null);

  // Review mode
  const [reviewQueue, setReviewQueue] = useState<QuizItem[]>([]);

  // Quiz UI state
  const [userInput, setUserInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);
  const [completedWords, setCompletedWords] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Load initial data ──
  const loadData = useCallback(async () => {
    if (isNaN(folderId)) return;
    const [folderData, all, newCards, reviewCards] = await Promise.all([
      getFolderById(folderId),
      getCardsByFolder(folderId),
      getNewCards(folderId, 5),
      getReviewCards(folderId, 15),
    ]);
    if (!folderData) return;
    if (all.length < 4) {
      alert("Cần ít nhất 4 thẻ để bắt đầu!");
      router.push(`/folders/${folderId}`);
      return;
    }
    setFolder(folderData);
    setAllCards(all);
    setNewCount(newCards.length);
    setDueCount(reviewCards.length);
    setPhase("select-mode");
  }, [folderId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Audio ──
  const playAudio = useCallback((text: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=en-US`);
    audioRef.current = audio;
    audio.play();
  }, []);

  // ════════════════════════════════════════════════════════════════
  //  LEARN MODE — Batching & Interleaving Engine
  // ════════════════════════════════════════════════════════════════

  const buildNextQuestion = useCallback(
    (batch: SessionWord[], allCardsList: Card[]): QuizItem | null => {
      const maxLevel = 6;
      const active = batch.filter((w) => w.sessionLevel < maxLevel);
      if (active.length === 0) return null;

      active.sort((a, b) => a.sessionLevel - b.sessionLevel);

      const lowestLevel = active[0].sessionLevel;
      const candidates = active.filter((w) => w.sessionLevel === lowestLevel);
      const randomWord = candidates[Math.floor(Math.random() * candidates.length)];

      const levelType = getLevelType(randomWord.sessionLevel);
      const card = randomWord.card;

      let options: string[] | undefined;

      if (levelType === "abcd-en-vn") {
        const correct = card.translation;
        const wrongs = shuffleArray(allCardsList.filter((c) => c.id !== card.id))
          .slice(0, 3)
          .map((c) => c.translation);
        options = shuffleArray([correct, ...wrongs]);
      } else if (levelType === "abcd-vn-en" || levelType === "audio-select") {
        const correct = card.word;
        const wrongs = shuffleArray(allCardsList.filter((c) => c.id !== card.id))
          .slice(0, 3)
          .map((c) => c.word);
        options = shuffleArray([correct, ...wrongs]);
      }

      return { word: randomWord, levelType, options };
    },
    []
  );

  const startLearnMode = useCallback(async () => {
    const newCards = await getNewCards(folderId, 5);
    if (newCards.length === 0) {
      alert("Tất cả thẻ đã được học xong! Hãy thêm thẻ mới hoặc ôn tập.");
      return;
    }

    const batch: SessionWord[] = newCards.map((card) => ({
      card,
      sessionLevel: card.growthLevel,
    }));

    setSessionBatch(batch);
    setSessionCorrect(0);
    setSessionIncorrect(0);
    setCompletedWords(0);

    const firstItem = buildNextQuestion(batch, allCards);
    setCurrentItem(firstItem);
    setPhase("learn");
  }, [folderId, allCards, buildNextQuestion]);

  // ════════════════════════════════════════════════════════════════
  //  REVIEW MODE
  // ════════════════════════════════════════════════════════════════

  const startReviewMode = useCallback(async () => {
    const reviewCards = await getReviewCards(folderId, 15);
    if (reviewCards.length === 0) {
      alert("Không có thẻ nào cần ôn tập lúc này!");
      return;
    }

    const items: QuizItem[] = shuffleArray(reviewCards).map((card) => {
      const maxLevel = 6;
      const randomWord: SessionWord = { card, sessionLevel: maxLevel };
      
      const rand = Math.random();
      if (rand < 0.33) {
        return { 
          word: randomWord, 
          levelType: "abcd-en-vn" as LevelType, 
          options: shuffleArray([card.translation, ...shuffleArray(allCards.filter(c => c.id !== card.id)).slice(0, 3).map(c => c.translation)]) 
        };
      } else if (rand < 0.66) {
        return { word: randomWord, levelType: "typing" as LevelType };
      }
      return { word: randomWord, levelType: "sentence" as LevelType };
    });

    setReviewQueue(items);
    setCurrentItem(items[0] || null);
    setSessionCorrect(0);
    setSessionIncorrect(0);
    setPhase("review");
  }, [folderId, allCards]);

  // ════════════════════════════════════════════════════════════════
  //  ANSWER HANDLING
  // ════════════════════════════════════════════════════════════════

  useEffect(() => {
    setUserInput("");
    setSelectedOption(null);
    setFeedback(null);
    setShowAnswer(false);

    if (currentItem) {
      if (currentItem.levelType === "typing" || currentItem.levelType === "sentence") {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      if (currentItem.levelType === "audio-select") {
        setTimeout(() => playAudio(currentItem.word.card.word || ""), 300);
      }
    }
  }, [currentItem, playAudio]);

  const advanceToNext = useCallback(
    (delay: number) => {
      setTimeout(() => {
        if (phase === "learn") {
          const maxLevel = 6;
          const active = sessionBatch.filter((w) => w.sessionLevel < maxLevel);
          if (active.length === 0) {
            setPhase("results");
          } else {
            const next = buildNextQuestion(sessionBatch, allCards);
            setCurrentItem(next);
          }
        } else if (phase === "review") {
          const currentIdx = reviewQueue.findIndex(
            (item) => item === currentItem
          );
          if (currentIdx >= reviewQueue.length - 1) {
            setPhase("results");
          } else {
            setCurrentItem(reviewQueue[currentIdx + 1]);
          }
        }
      }, delay);
    },
    [phase, sessionBatch, reviewQueue, currentItem, allCards, buildNextQuestion]
  );

  const handleCorrect = useCallback(async () => {
    if (!currentItem) return;
    setFeedback("correct");
    setSessionCorrect((p) => p + 1);

    const card = currentItem.word.card;

    if (phase === "learn") {
      const newLevel = currentItem.word.sessionLevel + 1;
      currentItem.word.sessionLevel = newLevel;

      await updateGrowthLevel(card.id, true);

      const maxLevel = 6;
      if (newLevel >= maxLevel) {
        setCompletedWords((p) => p + 1);
      }
    } else {
      await updateSRS(card.id, true);
    }

    advanceToNext(400); 
  }, [currentItem, phase, advanceToNext]);

  const handleIncorrect = useCallback(async () => {
    if (!currentItem) return;
    setFeedback("incorrect");
    setShowAnswer(true);
    setSessionIncorrect((p) => p + 1);

    const card = currentItem.word.card;

    if (phase === "learn") {
      currentItem.word.sessionLevel = Math.max(0, currentItem.word.sessionLevel - 1);
      await updateGrowthLevel(card.id, false);
    } else {
      await updateSRS(card.id, false);
    }

    advanceToNext(1500);
  }, [currentItem, phase, advanceToNext]);

  // ── Handlers ──
  const handleOptionSelect = (option: string) => {
    if (feedback || !currentItem) return;
    setSelectedOption(option);

    const card = currentItem.word.card;
    let correct: string;

    if (currentItem.levelType === "abcd-en-vn") {
      correct = card.translation;
    } else if (currentItem.levelType === "abcd-vn-en" || currentItem.levelType === "audio-select") {
      correct = card.word || "";
    } else return;

    if (option === correct) handleCorrect();
    else handleIncorrect();
  };

  const handleTypingSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || feedback || !currentItem) return;
    const card = currentItem.word.card;
    const answer = userInput.trim().toLowerCase();

    if (answer === (card.word || "").toLowerCase()) handleCorrect();
    else handleIncorrect();
  };

  const handleFlashcardNext = () => handleCorrect();

  const handleSentenceSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || feedback || !currentItem) return;
    const card = currentItem.word.card;
    const answer = userInput.trim().toLowerCase();
    
    const wordTarget = (card.word || "").toLowerCase();
    if (wordTarget && answer.includes(wordTarget)) handleCorrect();
    else handleIncorrect();
  };

  // ════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════

  if (phase === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="inline-block w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Select Mode ──
  if (phase === "select-mode") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-center mb-2 gradient-text">
          Chọn Chế Độ
        </h1>
        <p className="text-center text-foreground-muted mb-10 text-sm">
          Học từ mới hoặc ôn tập từ đã học
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Learn */}
          <button
            onClick={startLearnMode}
            disabled={newCount === 0}
            className={`glass-card p-6 text-left transition-all cursor-pointer group ${
              newCount > 0
                ? "hover:scale-[1.02] hover:border-emerald/30 hover:shadow-lg hover:shadow-emerald/10"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">🌱</span>
              {newCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-emerald/15 text-emerald text-sm font-bold">
                  {newCount}
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg mb-1 group-hover:text-emerald transition-colors">
              Học từ mới
            </h3>
            <p className="text-sm text-foreground-muted">
              {newCount > 0
                ? `Gieo hạt ${Math.min(newCount, 5)} từ vựng mới.`
                : "Tất cả từ đã được học! Thêm thẻ mới hoặc ôn tập."}
            </p>
          </button>

          {/* Review */}
          <button
            onClick={startReviewMode}
            disabled={dueCount === 0}
            className={`glass-card p-6 text-left transition-all cursor-pointer group ${
              dueCount > 0
                ? "hover:scale-[1.02] hover:border-sakura/30 hover:shadow-lg hover:shadow-sakura/10"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">💧</span>
              {dueCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-sakura/15 text-sakura-light text-sm font-bold">
                  {dueCount}
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg mb-1 group-hover:text-sakura-light transition-colors">
              Ôn tập
            </h3>
            <p className="text-sm text-foreground-muted">
              {dueCount > 0
                ? `Tưới nước ${dueCount} bông hoa sắp héo.`
                : "Chưa có từ nào cần ôn tập lúc này!"}
            </p>
          </button>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => router.push(`/folders/${folderId}`)}
            className="text-foreground-muted hover:text-indigo-light text-sm transition-colors cursor-pointer"
          >
            ← Quay lại thư mục
          </button>
        </div>
      </div>
    );
  }

  // ── Results ──
  if (phase === "results") {
    const total = sessionCorrect + sessionIncorrect;
    const accuracy = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0;
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center animate-fade-in-up">
        <div className="glass-card p-8 sm:p-10 mb-8">
          <div className="text-5xl mb-4">
            {accuracy >= 80 ? "🌺" : accuracy >= 50 ? "🌸" : "🌱"}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {phase === "results" && completedWords > 0
              ? `${completedWords} từ đã nở hoa!`
              : "Phiên ôn tập hoàn tất!"}
          </h2>
          <p className="text-foreground-muted text-sm mb-6">
            {accuracy >= 80
              ? "Tuyệt vời! Bạn đã nắm rất vững!"
              : accuracy >= 50
              ? "Khá tốt! Hãy tiếp tục luyện tập!"
              : "Đừng nản, luyện thêm sẽ giỏi hơn!"}
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
            onClick={() => loadData()}
            className="btn-shine px-8 py-3 rounded-2xl bg-gradient-to-r from-sakura to-indigo text-white font-semibold
                       hover:shadow-xl hover:shadow-sakura/20 hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            🔄 Tiếp tục
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

  if (!currentItem) return null;

  const card = currentItem.word.card;
  const levelType = currentItem.levelType;

  const correctDisplay =
    levelType === "abcd-en-vn"
      ? card.translation
      : card.word;

  const batchTotal = sessionBatch.length * 6;
  const batchProgress = sessionBatch.reduce((sum, w) => sum + w.sessionLevel, 0);

  const levelLabels: Record<LevelType, { icon: string; text: string; color: string }> = {
    flashcard:    { icon: "📖", text: "Giới thiệu từ mới",      color: "bg-emerald/10 border-emerald/30 text-emerald" },
    "abcd-en-vn": { icon: "🅰️", text: "Anh → Việt",             color: "bg-gold/10 border-gold/30 text-gold" },
    "audio-select": { icon: "🔊", text: "Nghe chọn từ",          color: "bg-indigo/10 border-indigo/30 text-indigo-light" },
    "abcd-vn-en": { icon: "🅰️", text: "Việt → Anh",             color: "bg-sakura/10 border-sakura/30 text-sakura-light" },
    typing:       { icon: "⌨️", text: "Gõ chính xác",           color: "bg-violet-500/10 border-violet-500/30 text-violet-400" },
    sentence:     { icon: "📝", text: "Viết câu",               color: "bg-rose/10 border-rose/30 text-rose" },
  };

  const label = levelLabels[levelType];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => {
            if (confirm("Bạn có chắc muốn thoát?")) loadData();
          }}
          className="text-foreground-muted hover:text-indigo-light text-sm transition-colors cursor-pointer"
        >
          ✕ Thoát
        </button>

        {phase === "learn" && (
          <div className="flex items-center gap-2">
            {sessionBatch.map((w, i) => (
              <span key={i} className="text-sm" title={`${w.card.word} — Lv.${w.sessionLevel}`}>
                {getGrowthIcon(w.sessionLevel)}
              </span>
            ))}
          </div>
        )}

        <div className="text-foreground-dim text-xs">
          {phase === "learn"
            ? `${Math.round((batchProgress / batchTotal) * 100)}%`
            : `${reviewQueue.findIndex((q) => q === currentItem) + 1}/${reviewQueue.length}`}
        </div>
      </div>

      {phase === "learn" && (
        <div className="w-full h-1.5 bg-surface-hover rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${(batchProgress / batchTotal) * 100}%` }}
          />
        </div>
      )}

      <div className="flex justify-center mb-4">
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border ${label.color}`}>
          {label.icon} {label.text}
        </span>
      </div>

      {levelType === "flashcard" && (
        <div className="glass-card w-full max-w-md mx-auto p-6 sm:p-10 text-center mb-6 animate-fade-in shadow-2xl shadow-indigo/5 border-t border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald to-teal-500 opacity-50" />
          {card.imageUrl && (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden mx-auto mb-6 border-2 border-white/10 shadow-lg">
              <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="text-4xl sm:text-5xl font-extrabold text-foreground mb-3 tracking-tight">
            {card.word}
          </div>
          <div className="text-indigo-light mb-2 text-sm sm:text-base font-medium bg-indigo/10 inline-block px-3 py-1 rounded-full">{card.phonetic}</div>
          <div className="text-xl sm:text-2xl font-semibold text-foreground mb-4 mt-2">{card.translation}</div>
          
          {card.definition && <div className="text-foreground-dim text-sm sm:text-base mb-4 px-4">{card.definition}</div>}
          
          {card.example && (
            <div className="bg-surface/50 p-4 rounded-xl text-foreground-muted text-sm sm:text-base italic mb-6 border border-border/50 text-left">
              💬 "{card.example}"
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={() => playAudio(card.word || "")}
              className="p-4 rounded-2xl bg-surface border border-border hover:bg-surface-hover hover:border-indigo/30 transition-all cursor-pointer text-2xl group flex items-center justify-center shrink-0"
              title="Nghe phát âm"
            >
              <span className="group-hover:scale-110 transition-transform">🔊</span>
            </button>
            <button
              onClick={handleFlashcardNext}
              className="flex-1 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-emerald to-teal-500 text-white
                         hover:shadow-xl hover:shadow-emerald/25 hover:scale-[1.02] active:scale-[0.98]
                         transition-all duration-300 cursor-pointer"
            >
              ✅ Đã nhớ — Tiếp tục
            </button>
          </div>
        </div>
      )}

      {(levelType === "abcd-en-vn" || levelType === "abcd-vn-en" || levelType === "audio-select") && (
        <>
          <div
            className={`glass-card w-full max-w-md mx-auto p-8 sm:p-12 text-center mb-8 transition-all duration-500 shadow-2xl relative overflow-hidden ${
              feedback === "correct" ? "shadow-emerald/20 border-emerald/50" : ""
            } ${feedback === "incorrect" ? "shadow-rose/20 border-rose/50 animate-shake" : "shadow-indigo/5 border-white/5"}`}
          >
            {feedback === "correct" && <div className="absolute inset-0 bg-emerald/5 animate-fade-in" />}
            {feedback === "incorrect" && <div className="absolute inset-0 bg-rose/5 animate-fade-in" />}
            
            <div className="relative z-10">
              {levelType === "audio-select" ? (
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => playAudio(card.word || "")}
                    className="w-24 h-24 flex items-center justify-center bg-indigo/10 text-indigo-light text-5xl rounded-full hover:bg-indigo/20 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                  >
                    🔊
                  </button>
                  <p className="text-foreground-muted text-sm sm:text-base mt-6 font-medium">Nghe và chọn đáp án đúng</p>
                </div>
              ) : (
                <div className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                  {levelType === "abcd-en-vn" ? card.word : card.translation}
                </div>
              )}

              {showAnswer && feedback === "incorrect" && (
                <div className="mt-8 pt-6 border-t border-border/50 animate-fade-in text-left">
                  <span className="text-xs sm:text-sm text-rose font-bold uppercase tracking-wider block mb-2">
                    Đáp án đúng:
                  </span>
                  <span className="text-2xl sm:text-3xl text-foreground font-bold">
                    {correctDisplay}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
            {currentItem.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleOptionSelect(opt)}
                disabled={feedback !== null}
                className={`
                  p-5 rounded-2xl font-semibold text-lg sm:text-xl text-center transition-all cursor-pointer shadow-sm
                  ${
                    selectedOption === opt
                      ? feedback === "correct"
                        ? "bg-emerald/20 border-2 border-emerald/50 text-emerald shadow-emerald/20 scale-[1.02]"
                        : "bg-rose/20 border-2 border-rose/50 text-rose shadow-rose/20 scale-[0.98]"
                      : "bg-surface border-2 border-border/50 text-foreground hover:bg-surface-hover hover:border-indigo/30 hover:shadow-md hover:-translate-y-1"
                  }
                  ${feedback && selectedOption !== opt && opt === correctDisplay ? "bg-emerald/20 border-2 border-emerald/50 text-emerald shadow-emerald/20 scale-[1.02] animate-pulse" : ""}
                  ${feedback && selectedOption !== opt && opt !== correctDisplay ? "opacity-50 grayscale" : ""}
                `}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}

      {levelType === "typing" && (
        <div
          className={`glass-card w-full max-w-md mx-auto p-8 sm:p-12 text-center transition-all duration-500 shadow-2xl relative overflow-hidden ${
            feedback === "correct" ? "shadow-emerald/20 border-emerald/50" : ""
          } ${feedback === "incorrect" ? "shadow-rose/20 border-rose/50 animate-shake" : "shadow-indigo/5 border-white/5"}`}
        >
          {feedback === "correct" && <div className="absolute inset-0 bg-emerald/5 animate-fade-in" />}
          {feedback === "incorrect" && <div className="absolute inset-0 bg-rose/5 animate-fade-in" />}

          <div className="relative z-10">
            <div className="text-2xl sm:text-4xl font-extrabold mb-8">{card.translation}</div>

            <form onSubmit={handleTypingSubmit} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={feedback !== null}
                className={`w-full text-center text-3xl font-bold px-6 py-5 rounded-2xl bg-surface/50 border-2 text-foreground
                           outline-none transition-all placeholder:text-foreground-muted/30
                           ${feedback === "correct" ? "border-emerald/50 text-emerald" : feedback === "incorrect" ? "border-rose/50 text-rose" : "border-border/50 focus:border-indigo focus:ring-4 focus:ring-indigo/10"}`}
                placeholder="Gõ từ tiếng Anh..."
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || feedback !== null}
                className="w-full py-4 rounded-2xl font-bold text-lg bg-indigo text-white hover:bg-indigo-light hover:shadow-lg hover:shadow-indigo/20 transition-all disabled:opacity-50 disabled:hover:shadow-none"
              >
                Kiểm tra
              </button>
            </form>

            {showAnswer && feedback === "incorrect" && (
              <div className="mt-8 pt-6 border-t border-border/50 animate-fade-in text-left">
                <span className="text-xs sm:text-sm text-rose font-bold uppercase tracking-wider block mb-2">
                  Đáp án đúng:
                </span>
                <span className="text-3xl sm:text-4xl text-foreground font-bold">
                  {card.word}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {levelType === "sentence" && (
        <div
          className={`glass-card w-full max-w-md mx-auto p-8 sm:p-12 text-center transition-all duration-500 shadow-2xl relative overflow-hidden ${
            feedback === "correct" ? "shadow-emerald/20 border-emerald/50" : ""
          } ${feedback === "incorrect" ? "shadow-rose/20 border-rose/50 animate-shake" : "shadow-indigo/5 border-white/5"}`}
        >
          {feedback === "correct" && <div className="absolute inset-0 bg-emerald/5 animate-fade-in" />}
          {feedback === "incorrect" && <div className="absolute inset-0 bg-rose/5 animate-fade-in" />}

          <div className="relative z-10">
            <div className="text-3xl sm:text-5xl font-extrabold mb-3 tracking-tight">{card.word}</div>
            <div className="text-foreground-dim text-base sm:text-lg mb-6 font-medium">({card.translation})</div>
            
            <p className="text-sm sm:text-base text-foreground-muted mb-6 bg-surface/50 p-3 rounded-lg border border-border/50">
              Hãy viết một câu tiếng Anh có chứa từ này.
            </p>

            <form onSubmit={handleSentenceSubmit} className="space-y-4">
              <textarea
                ref={inputRef as any}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={feedback !== null}
                rows={3}
                className={`w-full text-center text-lg sm:text-xl font-medium px-5 py-4 rounded-2xl bg-surface/50 border-2 text-foreground
                           outline-none transition-all placeholder:text-foreground-muted/30 resize-none
                           ${feedback === "correct" ? "border-emerald/50 text-emerald" : feedback === "incorrect" ? "border-rose/50 text-rose" : "border-border/50 focus:border-indigo focus:ring-4 focus:ring-indigo/10"}`}
                placeholder="VD: I want to eat an apple."
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || feedback !== null}
                className="w-full py-4 rounded-2xl font-bold text-lg bg-rose text-white hover:bg-rose/80 hover:shadow-lg hover:shadow-rose/20 transition-all disabled:opacity-50 disabled:hover:shadow-none"
              >
                Kiểm tra
              </button>
            </form>

            {showAnswer && feedback === "incorrect" && (
              <div className="mt-8 pt-6 border-t border-border/50 animate-fade-in text-left">
                <span className="text-xs sm:text-sm text-rose font-bold uppercase tracking-wider block mb-2">
                  Gợi ý:
                </span>
                <span className="text-base sm:text-lg text-foreground-muted">
                  Câu của bạn cần chứa chính xác từ <strong className="text-foreground font-bold">{card.word}</strong>.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
