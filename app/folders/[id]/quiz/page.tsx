"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getCardsByFolder,
  getNewCards,
  getReviewCards,
  updateGrowthLevel,
  updateSRS,
} from "@/actions/card-actions";
import { shuffleArray } from "@/lib/shuffle";
import type { Card } from "@/db/schema";
import DrawingCanvas from "@/components/drawing-canvas";

// ─── Types ───────────────────────────────────────────────────────
type Phase = "loading" | "select-mode" | "learn" | "review" | "results";
type LevelType =
  | "flashcard"      // 0→1
  | "abcd-jp-vn"     // 1→2
  | "audio-select"   // 2→3
  | "abcd-vn-jp"     // 3→4
  | "scramble"       // 4→5
  | "handwriting"    // 5→6
  | "typing";        // 6→7

interface SessionWord {
  card: Card;
  sessionLevel: number; // 0-7, tracked per-session
}

interface QuizItem {
  word: SessionWord;
  levelType: LevelType;
  options?: string[];        // ABCD options
  scrambleTiles?: string[];  // Scramble tiles
}

// ─── Level → Quiz type mapping ───────────────────────────────────
function getLevelType(level: number): LevelType {
  switch (level) {
    case 0: return "flashcard";
    case 1: return "abcd-jp-vn";
    case 2: return "audio-select";
    case 3: return "abcd-vn-jp";
    case 4: return "scramble";
    case 5: return "handwriting";
    case 6: return "typing";
    default: return "typing";
  }
}

// ─── Growth icon ────────────────────────────────────────────────
function getGrowthIcon(level: number): string {
  const icons = ["🌰", "🌱", "🪴", "☘️", "🌿", "🌷", "🌸", "🌺"];
  return icons[Math.min(level, 7)];
}

// ─── Scramble: split kana/romaji into tiles ─────────────────────
function createScrambleTiles(text: string, isKana: boolean): string[] {
  if (isKana) {
    // Split kana into individual characters
    return shuffleArray([...text]);
  }
  // For romaji, split into character groups (2-3 chars each)
  const tiles: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunkSize = Math.min(2, text.length - i);
    tiles.push(text.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return shuffleArray(tiles);
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;

  // ── State ──
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
  const [scrambleSelected, setScrambleSelected] = useState<string[]>([]);
  const [scrambleAvailable, setScrambleAvailable] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);
  const [completedWords, setCompletedWords] = useState(0);
  const [typingStartTime, setTypingStartTime] = useState(0);
  const [speedBonus, setSpeedBonus] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Load initial data ──
  const loadData = useCallback(async () => {
    const [all, newCards, reviewCards] = await Promise.all([
      getCardsByFolder(folderId),
      getNewCards(folderId, 5),
      getReviewCards(folderId, 15),
    ]);
    if (all.length < 4) {
      alert("Cần ít nhất 4 thẻ để bắt đầu!");
      router.push(`/folders/${folderId}`);
      return;
    }
    setAllCards(all);
    setNewCount(newCards.length);
    setDueCount(reviewCards.length);
    setPhase("select-mode");
  }, [folderId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Audio ──
  const playAudio = useCallback((text: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=ja`);
    audioRef.current = audio;
    audio.play();
  }, []);

  // ════════════════════════════════════════════════════════════════
  //  LEARN MODE — Batching & Interleaving Engine
  // ════════════════════════════════════════════════════════════════

  const buildNextQuestion = useCallback(
    (batch: SessionWord[], allCardsList: Card[]): QuizItem | null => {
      // Filter words not yet completed
      const active = batch.filter((w) => w.sessionLevel < 7);
      if (active.length === 0) return null;

      // Pick word with lowest level (prioritize diversity)
      active.sort((a, b) => a.sessionLevel - b.sessionLevel);

      // Among words with the same (lowest) level, pick randomly
      const lowestLevel = active[0].sessionLevel;
      const candidates = active.filter((w) => w.sessionLevel === lowestLevel);
      const word = candidates[Math.floor(Math.random() * candidates.length)];

      const levelType = getLevelType(word.sessionLevel);
      const card = word.card;

      let options: string[] | undefined;
      let scrambleTiles: string[] | undefined;

      if (levelType === "abcd-jp-vn") {
        // JP → VN: show kana, pick meaning
        const correct = card.meaning;
        const wrongs = shuffleArray(allCardsList.filter((c) => c.id !== card.id))
          .slice(0, 3)
          .map((c) => c.meaning);
        options = shuffleArray([correct, ...wrongs]);
      } else if (levelType === "abcd-vn-jp") {
        // VN → JP: show meaning, pick kana/kanji
        const correct = card.kanji || card.kana;
        const wrongs = shuffleArray(allCardsList.filter((c) => c.id !== card.id))
          .slice(0, 3)
          .map((c) => c.kanji || c.kana);
        options = shuffleArray([correct, ...wrongs]);
      } else if (levelType === "audio-select") {
        // Audio → select correct word
        const correct = card.kanji || card.kana;
        const wrongs = shuffleArray(allCardsList.filter((c) => c.id !== card.id))
          .slice(0, 3)
          .map((c) => c.kanji || c.kana);
        options = shuffleArray([correct, ...wrongs]);
      } else if (levelType === "scramble") {
        // Scramble kana characters
        const isKana = /[\u3040-\u30FF]/.test(card.kana);
        scrambleTiles = createScrambleTiles(isKana ? card.kana : card.romaji, isKana);
      }

      return { word, levelType, options, scrambleTiles };
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
      sessionLevel: card.growthLevel, // start from DB growth level
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

    // Build review questions: mix of ABCD and typing
    const items: QuizItem[] = shuffleArray(reviewCards).map((card) => {
      const word: SessionWord = { card, sessionLevel: 7 };
      const useTyping = Math.random() < 0.5;

      if (useTyping) {
        return { word, levelType: "typing" as LevelType };
      } else {
        const isJpToVn = Math.random() < 0.5;
        if (isJpToVn) {
          const correct = card.meaning;
          const wrongs = shuffleArray(allCards.filter((c) => c.id !== card.id))
            .slice(0, 3)
            .map((c) => c.meaning);
          return {
            word,
            levelType: "abcd-jp-vn" as LevelType,
            options: shuffleArray([correct, ...wrongs]),
          };
        } else {
          const correct = card.kanji || card.kana;
          const wrongs = shuffleArray(allCards.filter((c) => c.id !== card.id))
            .slice(0, 3)
            .map((c) => c.kanji || c.kana);
          return {
            word,
            levelType: "abcd-vn-jp" as LevelType,
            options: shuffleArray([correct, ...wrongs]),
          };
        }
      }
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

  // Reset UI when question changes
  useEffect(() => {
    setUserInput("");
    setSelectedOption(null);
    setScrambleSelected([]);
    setFeedback(null);
    setShowAnswer(false);
    setSpeedBonus(null);

    if (currentItem) {
      if (currentItem.scrambleTiles) {
        setScrambleAvailable([...currentItem.scrambleTiles]);
      }
      if (currentItem.levelType === "typing") {
        setTypingStartTime(Date.now());
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      if (currentItem.levelType === "audio-select") {
        // Auto-play audio for audio questions
        setTimeout(() => playAudio(currentItem.word.card.kanji || currentItem.word.card.kana), 300);
      }
    }
  }, [currentItem, playAudio]);

  const advanceToNext = useCallback(
    (delay: number) => {
      setTimeout(() => {
        if (phase === "learn") {
          const active = sessionBatch.filter((w) => w.sessionLevel < 7);
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
      // Update session level
      const newLevel = currentItem.word.sessionLevel + 1;
      currentItem.word.sessionLevel = newLevel;

      // Speed bonus for typing (level 5→6)
      if (currentItem.levelType === "typing" && typingStartTime > 0) {
        const elapsed = (Date.now() - typingStartTime) / 1000;
        if (elapsed < 3) setSpeedBonus(3);
        else if (elapsed < 5) setSpeedBonus(2);
        else if (elapsed < 8) setSpeedBonus(1);
      }

      // Persist to DB
      await updateGrowthLevel(card.id, true);

      if (newLevel >= 7) {
        setCompletedWords((p) => p + 1);
      }
    } else {
      // Review mode
      await updateSRS(card.id, true);
    }

    advanceToNext(1200);
  }, [currentItem, phase, typingStartTime, advanceToNext]);

  const handleIncorrect = useCallback(async () => {
    if (!currentItem) return;
    setFeedback("incorrect");
    setShowAnswer(true);
    setSessionIncorrect((p) => p + 1);

    const card = currentItem.word.card;

    if (phase === "learn") {
      // Decrease session level (min 0)
      currentItem.word.sessionLevel = Math.max(0, currentItem.word.sessionLevel - 1);
      await updateGrowthLevel(card.id, false);
    } else {
      // Review: hoa héo
      await updateSRS(card.id, false);
    }

    advanceToNext(2500);
  }, [currentItem, phase, advanceToNext]);

  // ── ABCD handler ──
  const handleOptionSelect = (option: string) => {
    if (feedback || !currentItem) return;
    setSelectedOption(option);

    const card = currentItem.word.card;
    let correct: string;

    if (currentItem.levelType === "abcd-jp-vn") {
      correct = card.meaning;
    } else if (currentItem.levelType === "abcd-vn-jp" || currentItem.levelType === "audio-select") {
      correct = card.kanji || card.kana;
    } else return;

    if (option === correct) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  };

  // ── Typing handler ──
  const handleTypingSubmit = () => {
    if (!userInput.trim() || feedback || !currentItem) return;
    const card = currentItem.word.card;
    const answer = userInput.trim().toLowerCase();

    const isCorrect =
      answer === card.kana.toLowerCase() ||
      answer === (card.kanji || "").toLowerCase() ||
      answer === card.romaji.toLowerCase();

    if (isCorrect) handleCorrect();
    else handleIncorrect();
  };

  // ── Scramble handlers ──
  const handleScrambleTileClick = (tile: string, index: number) => {
    if (feedback) return;
    setScrambleSelected((prev) => [...prev, tile]);
    setScrambleAvailable((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleScrambleRemoveTile = (index: number) => {
    if (feedback) return;
    const tile = scrambleSelected[index];
    setScrambleSelected((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setScrambleAvailable((prev) => [...prev, tile]);
  };

  const handleScrambleSubmit = () => {
    if (feedback || !currentItem) return;
    const card = currentItem.word.card;
    const assembled = scrambleSelected.join("");
    const isKana = /[\u3040-\u30FF]/.test(card.kana);
    const correct = isKana ? card.kana : card.romaji;

    if (assembled === correct) handleCorrect();
    else handleIncorrect();
  };

  // ── Flashcard "Got it" ──
  const handleFlashcardNext = () => {
    handleCorrect();
  };

  // ── Handwriting ──
  const handleHandwritingSelect = (selectedChar: string) => {
    if (feedback || !currentItem) return;
    const card = currentItem.word.card;
    const correct = card.kanji || card.kana;
    // Check if the selected char matches kanji or kana
    if (selectedChar === correct || selectedChar === card.kana || selectedChar === card.kanji) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
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
                ? `Gieo hạt ${Math.min(newCount, 5)} từ vựng mới. Flashcard → Trắc nghiệm → Nghe → Ghép → Gõ.`
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
                ? `Tưới nước ${dueCount} bông hoa sắp héo. Trắc nghiệm & gõ xen kẽ.`
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

  // ── Quiz Rendering ──
  if (!currentItem) return null;

  const card = currentItem.word.card;
  const levelType = currentItem.levelType;

  // Correct answer for showing when wrong
  const correctDisplay =
    levelType === "abcd-jp-vn"
      ? card.meaning
      : levelType === "abcd-vn-jp" || levelType === "audio-select"
      ? card.kanji || card.kana
      : card.kana;

  // Progress bar for learn mode
  const batchTotal = sessionBatch.length * 7;
  const batchProgress = sessionBatch.reduce((sum, w) => sum + w.sessionLevel, 0);

  // Level type label
  const levelLabels: Record<LevelType, { icon: string; text: string; color: string }> = {
    flashcard:    { icon: "📖", text: "Giới thiệu từ mới",      color: "bg-emerald/10 border-emerald/30 text-emerald" },
    "abcd-jp-vn": { icon: "🅰️", text: "Nhật → Việt",            color: "bg-gold/10 border-gold/30 text-gold" },
    "audio-select": { icon: "🔊", text: "Nghe chọn từ",          color: "bg-indigo/10 border-indigo/30 text-indigo-light" },
    "abcd-vn-jp": { icon: "🅰️", text: "Việt → Nhật",            color: "bg-sakura/10 border-sakura/30 text-sakura-light" },
    scramble:     { icon: "🧩", text: "Ghép ký tự",             color: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
    handwriting:  { icon: "✍️", text: "Vẽ chữ",                color: "bg-sky-500/10 border-sky-500/30 text-sky-400" },
    typing:       { icon: "⌨️", text: "Gõ chính xác",           color: "bg-violet-500/10 border-violet-500/30 text-violet-400" },
  };

  const label = levelLabels[levelType];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      {/* Header */}
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
              <span key={i} className="text-sm" title={`${w.card.kana} — Lv.${w.sessionLevel}`}>
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

      {/* Progress bar (learn mode) */}
      {phase === "learn" && (
        <div className="w-full h-1.5 bg-surface-hover rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${(batchProgress / batchTotal) * 100}%` }}
          />
        </div>
      )}

      {/* Type badge */}
      <div className="flex justify-center mb-4">
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border ${label.color}`}>
          {label.icon} {label.text}
        </span>
      </div>

      {/* ═══════════════════════ FLASHCARD ═══════════════════════ */}
      {levelType === "flashcard" && (
        <div className="glass-card w-full max-w-sm mx-auto p-8 text-center mb-6 animate-fade-in">
          {card.imageUrl && (
            <div className="w-24 h-24 rounded-xl overflow-hidden mx-auto mb-4 border border-border/50">
              <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          {card.kanji && (
            <div className="kana-display text-5xl font-bold text-foreground mb-2">
              {card.kanji}
            </div>
          )}
          <div className="kana-display text-3xl text-indigo-light mb-1">{card.kana}</div>
          <div className="text-foreground-dim text-sm mb-3">[{card.romaji}]</div>
          <div className="text-xl font-semibold text-foreground mb-3">{card.meaning}</div>
          {card.usage && (
            <p className="text-foreground-dim text-sm italic mb-4">💬 {card.usage}</p>
          )}
          <button
            onClick={() => playAudio(card.kanji || card.kana)}
            className="p-3 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer text-2xl mb-4"
          >
            🔊
          </button>
          <button
            onClick={handleFlashcardNext}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald to-teal-500 text-white
                       hover:shadow-lg hover:shadow-emerald/25 hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-200 cursor-pointer"
          >
            ✅ Đã nhớ — Tiếp tục
          </button>
        </div>
      )}

      {/* ═══════════════════════ ABCD ═══════════════════════ */}
      {(levelType === "abcd-jp-vn" || levelType === "abcd-vn-jp" || levelType === "audio-select") && (
        <>
          {/* Question */}
          <div
            className={`glass-card w-full max-w-sm mx-auto p-8 text-center mb-6 transition-all duration-300 ${
              feedback === "correct" ? "correct-glow" : ""
            } ${feedback === "incorrect" ? "incorrect-glow animate-shake" : ""}`}
          >
            {levelType === "audio-select" ? (
              <>
                <button
                  onClick={() => playAudio(card.kanji || card.kana)}
                  className="text-5xl p-4 rounded-2xl hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  🔊
                </button>
                <p className="text-foreground-dim text-sm mt-3">Nghe và chọn từ đúng</p>
              </>
            ) : levelType === "abcd-jp-vn" ? (
              <>
                {card.kanji && (
                  <div className="kana-display text-4xl font-bold text-foreground mb-1">
                    {card.kanji}
                  </div>
                )}
                <div className="kana-display text-3xl text-indigo-light">{card.kana}</div>
                <div className="text-foreground-dim text-xs mt-1">[{card.romaji}]</div>
                <button
                  onClick={() => playAudio(card.kanji || card.kana)}
                  className="mt-2 p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer text-xl"
                >
                  🔊
                </button>
                <p className="text-foreground-dim text-xs mt-2">Chọn nghĩa đúng</p>
              </>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {card.meaning}
                </div>
                <p className="text-foreground-dim text-xs">Chọn từ tiếng Nhật đúng</p>
              </>
            )}
          </div>

          {/* Options */}
          <div className="w-full max-w-sm mx-auto grid grid-cols-1 gap-2">
            {currentItem.options?.map((option, i) => {
              const isSelected = selectedOption === option;
              const isCorrectOpt = option === correctDisplay;
              let cls =
                "glass-card p-3 text-center cursor-pointer hover:scale-[1.02] transition-all duration-200 text-sm font-medium";

              if (feedback) {
                if (isCorrectOpt) cls += " !border-emerald !bg-emerald/10 text-emerald";
                else if (isSelected && !isCorrectOpt) cls += " !border-rose !bg-rose/10 text-rose";
                else cls += " opacity-50";
              } else {
                cls += " hover:border-indigo/50";
              }

              const isJapanese =
                levelType === "abcd-vn-jp" || levelType === "audio-select";

              return (
                <button
                  key={i}
                  onClick={() => handleOptionSelect(option)}
                  disabled={!!feedback}
                  className={cls}
                >
                  <span className="text-foreground-dim mr-2 text-xs">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span className={isJapanese ? "kana-display" : ""}>{option}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════ SCRAMBLE ═══════════════════════ */}
      {levelType === "scramble" && (
        <>
          <div
            className={`glass-card w-full max-w-sm mx-auto p-6 text-center mb-6 transition-all duration-300 ${
              feedback === "correct" ? "correct-glow" : ""
            } ${feedback === "incorrect" ? "incorrect-glow animate-shake" : ""}`}
          >
            <div className="text-2xl font-bold text-foreground mb-2">{card.meaning}</div>
            <p className="text-foreground-dim text-xs">Ghép đúng thứ tự ký tự</p>
          </div>

          {/* Selected tiles (answer area) */}
          <div className="w-full max-w-sm mx-auto mb-4">
            <div
              className={`min-h-[52px] flex flex-wrap gap-2 justify-center items-center p-3 rounded-xl border-2 border-dashed transition-colors ${
                feedback === "correct"
                  ? "border-emerald bg-emerald/5"
                  : feedback === "incorrect"
                  ? "border-rose bg-rose/5"
                  : "border-border"
              }`}
            >
              {scrambleSelected.length === 0 && (
                <span className="text-foreground-dim text-sm">Bấm vào ký tự bên dưới...</span>
              )}
              {scrambleSelected.map((tile, i) => (
                <button
                  key={`sel-${i}`}
                  onClick={() => handleScrambleRemoveTile(i)}
                  disabled={!!feedback}
                  className="px-4 py-2 rounded-lg bg-indigo/20 border border-indigo/40 text-indigo-light font-bold
                             text-lg kana-display hover:bg-indigo/30 transition-colors cursor-pointer"
                >
                  {tile}
                </button>
              ))}
            </div>
          </div>

          {/* Available tiles */}
          <div className="w-full max-w-sm mx-auto flex flex-wrap gap-2 justify-center mb-4">
            {scrambleAvailable.map((tile, i) => (
              <button
                key={`avail-${i}`}
                onClick={() => handleScrambleTileClick(tile, i)}
                disabled={!!feedback}
                className="px-4 py-2 rounded-lg bg-surface border border-border text-foreground font-bold
                           text-lg kana-display hover:border-indigo/50 hover:scale-105 transition-all cursor-pointer"
              >
                {tile}
              </button>
            ))}
          </div>

          {/* Submit scramble */}
          {!feedback && scrambleAvailable.length === 0 && scrambleSelected.length > 0 && (
            <div className="w-full max-w-sm mx-auto">
              <button
                onClick={handleScrambleSubmit}
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-sakura to-indigo text-white
                           hover:shadow-lg hover:shadow-sakura/25 hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-200 cursor-pointer"
              >
                Kiểm tra
              </button>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════ HANDWRITING ═══════════════════════ */}
      {levelType === "handwriting" && (
        <>
          <div
            className={`glass-card w-full max-w-sm mx-auto p-6 text-center mb-6 transition-all duration-300 ${
              feedback === "correct" ? "correct-glow" : ""
            } ${feedback === "incorrect" ? "incorrect-glow animate-shake" : ""}`}
          >
            <div className="text-2xl font-bold text-foreground mb-2">{card.meaning}</div>
            <p className="text-foreground-dim text-xs">Vẽ nét chữ Nhật tương ứng</p>
          </div>

          <div className="w-full max-w-sm mx-auto flex justify-center mb-6">
            <DrawingCanvas
              onCharacterSelected={handleHandwritingSelect}
              selectedChar=""
              disabled={!!feedback}
            />
          </div>
        </>
      )}

      {/* ═══════════════════════ TYPING ═══════════════════════ */}
      {levelType === "typing" && (
        <>
          <div
            className={`glass-card w-full max-w-sm mx-auto p-8 text-center mb-6 transition-all duration-300 ${
              feedback === "correct" ? "correct-glow" : ""
            } ${feedback === "incorrect" ? "incorrect-glow animate-shake" : ""}`}
          >
            <div className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {card.meaning}
            </div>
            {card.usage && (
              <p className="text-foreground-dim text-xs italic mb-2">💬 {card.usage}</p>
            )}
            <p className="text-foreground-dim text-xs">Gõ Kana hoặc Romaji chính xác</p>
          </div>

          <div className="w-full max-w-sm mx-auto space-y-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !feedback) handleTypingSubmit();
                }}
                placeholder="Nhập Kana hoặc Romaji..."
                disabled={!!feedback}
                className={`w-full px-4 py-3 rounded-xl bg-surface border text-center text-lg font-medium kana-display
                  outline-none transition-all duration-300 placeholder:text-foreground-dim/40 ${
                    feedback === "correct"
                      ? "border-emerald bg-emerald/10 text-emerald"
                      : feedback === "incorrect"
                      ? "border-rose bg-rose/10 text-rose"
                      : "border-border focus:border-indigo focus:ring-2 focus:ring-indigo/20 text-foreground"
                  }`}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {feedback && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl animate-confetti-pop">
                  {feedback === "correct" ? "✅" : "❌"}
                </span>
              )}
            </div>

            {!feedback && (
              <button
                onClick={handleTypingSubmit}
                disabled={!userInput.trim()}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                  userInput.trim()
                    ? "bg-gradient-to-r from-sakura to-indigo text-white hover:shadow-lg hover:shadow-sakura/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    : "bg-surface-hover text-foreground-dim cursor-not-allowed"
                }`}
              >
                Kiểm tra
              </button>
            )}

            {/* Speed bonus */}
            {speedBonus !== null && feedback === "correct" && (
              <div className="text-center p-2 rounded-xl bg-gold/10 border border-gold/20 animate-fade-in">
                <p className="text-gold font-semibold text-sm">
                  ⚡ Speed Bonus +{speedBonus}!
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════ FEEDBACK ═══════════════════════ */}
      <div className="w-full max-w-sm mx-auto mt-4 space-y-2">
        {showAnswer && (
          <div className="text-center p-3 rounded-xl bg-rose/10 border border-rose/20 animate-fade-in">
            <p className="text-rose/70 text-xs mb-1">Đáp án đúng:</p>
            <p className="text-xl font-bold text-rose kana-display">{correctDisplay}</p>
            {card.meaning && levelType !== "abcd-jp-vn" && (
              <p className="text-rose/50 text-xs mt-1">{card.meaning}</p>
            )}
          </div>
        )}

        {feedback === "correct" && levelType !== "flashcard" && (
          <div className="text-center p-3 rounded-xl bg-emerald/10 border border-emerald/20 animate-fade-in">
            <p className="text-emerald font-semibold">
              🎉 Chính xác! {getGrowthIcon(currentItem.word.sessionLevel)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
