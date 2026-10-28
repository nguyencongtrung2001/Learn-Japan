"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCardsByFolder, updateGrowthLevel, updateSRS } from "@/actions/card-actions";
import { useAudio } from "@/hooks/use-audio";
import { MAX_GROWTH_LEVEL } from "@/lib/growth";
import { shuffleArray } from "@/lib/shuffle";
import {
  buildLearnQuestion,
  buildReviewItem,
  countDue,
  countLearned,
  countNew,
  getChoiceAnswer,
  isTypingCorrect,
  pickLearnedCards,
  pickNewCards,
  type Feedback,
  type Phase,
  type QuizItem,
  type SessionWord,
} from "@/lib/quiz";
import type { Card } from "@/db/schema";

const CORRECT_DELAY_MS = 400;
const INCORRECT_DELAY_MS = 1500;
const MIN_CARDS = 4;

const EMPTY_STATS = { correct: 0, incorrect: 0, completed: 0 };

function recordStudyToday() {
  if (typeof window === "undefined") return;
  try {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const stored = localStorage.getItem("studyStreak_global");
    const list: string[] = stored ? JSON.parse(stored) : [];
    if (!list.includes(key)) {
      list.push(key);
      localStorage.setItem("studyStreak_global", JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}

/**
 * Toàn bộ logic phiên học/ôn (Memrise-style) tách khỏi UI.
 *
 * Cải tiến so với bản cũ:
 *  - Bắt đầu phiên học/ôn tức thì: chọn thẻ cục bộ từ danh sách đã có, không gọi server.
 *  - Ghi DB không chặn UI: đưa vào hàng đợi tuần tự (giữ đúng thứ tự read-modify-write
 *    của từng thẻ) rồi chuyển câu ngay theo timer, thay vì `await` server mỗi câu.
 *  - Dữ liệu phiên (lô từ, hàng đợi ôn) nằm trong ref — đây là dữ liệu mutable không cần render —
 *    thay vì mutate object trong state; UI chỉ nhận bản sao `levels`.
 *  - Timer được dọn khi unmount/thoát để không setState sau khi rời trang.
 */
export function useQuizSession(
  folderId: number,
  initialCards: Card[],
  serverNow: number
) {
  const router = useRouter();
  const playAudio = useAudio();

  // ── State phục vụ render ──
  const [phase, setPhase] = useState<Phase>("select-mode");
  const [counts, setCounts] = useState(() => ({
    newCount: countNew(initialCards),
    dueCount: countDue(initialCards, serverNow),
    learnedCount: countLearned(initialCards),
  }));
  const [currentItem, setCurrentItem] = useState<QuizItem | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [levels, setLevels] = useState<{ word: string; level: number }[]>([]);
  const [reviewPosition, setReviewPosition] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState(EMPTY_STATS);

  // ── Dữ liệu phiên (không cần render) ──
  const cardsRef = useRef(initialCards);
  const phaseRef = useRef<Phase>("select-mode");
  const batchRef = useRef<SessionWord[]>([]);
  const reviewRef = useRef<{ queue: QuizItem[]; index: number }>({ queue: [], index: 0 });
  const isCramRef = useRef(false);
  const uidRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const showItem = useCallback((item: QuizItem | null) => {
    setCurrentItem(item);
    setFeedback(null);
    setSelectedOption(null);
  }, []);

  const syncLevels = useCallback(() => {
    setLevels(batchRef.current.map((w) => ({ word: w.card.word, level: w.sessionLevel })));
  }, []);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
  }, []);

  useEffect(() => cancelTimer, [cancelTimer]);

  // Ghi DB tuần tự, không bao giờ reject (lỗi chỉ log) để hàng đợi không bị kẹt.
  const enqueueWrite = useCallback((task: () => Promise<unknown>) => {
    writeQueueRef.current = writeQueueRef.current
      .then(() => task())
      .then(() => undefined)
      .catch((error) => console.error("Lỗi lưu tiến độ:", error));
  }, []);

  // ── Audio tự phát ở dạng "Nghe chọn từ" ──
  useEffect(() => {
    if (currentItem?.levelType !== "audio-select") return;
    const word = currentItem.word.card.word;
    const t = setTimeout(() => playAudio(word), 300);
    return () => clearTimeout(t);
  }, [currentItem, playAudio]);

  // ── Chuyển sang câu kế tiếp ──
  const advance = useCallback(() => {
    if (phaseRef.current === "learn") {
      const next = buildLearnQuestion(batchRef.current, cardsRef.current, ++uidRef.current);
      if (next) showItem(next);
      else changePhase("results");
    } else if (phaseRef.current === "review") {
      const review = reviewRef.current;
      const nextIndex = review.index + 1;
      if (nextIndex >= review.queue.length) {
        changePhase("results");
      } else {
        review.index = nextIndex;
        setReviewPosition({ current: nextIndex + 1, total: review.queue.length });
        showItem(review.queue[nextIndex]);
      }
    }
  }, [showItem, changePhase]);

  // ── Ghi nhận đáp án ──
  const answer = useCallback(
    (isCorrect: boolean) => {
      if (!currentItem || feedback) return;

      const { word } = currentItem;
      setFeedback(isCorrect ? "correct" : "incorrect");

      let completed = 0;
      if (phaseRef.current === "learn") {
        // Cập nhật bất biến: thay phần tử trong lô bằng bản sao với level mới.
        const base = batchRef.current.find((w) => w.card.id === word.card.id)?.sessionLevel ?? word.sessionLevel;
        const nextLevel = isCorrect ? base + 1 : Math.max(0, base - 1);
        batchRef.current = batchRef.current.map((w) =>
          w.card.id === word.card.id ? { ...w, sessionLevel: nextLevel } : w
        );
        if (isCorrect && nextLevel >= MAX_GROWTH_LEVEL) completed = 1;
        syncLevels();
        enqueueWrite(() => updateGrowthLevel(word.card.id, isCorrect));
      } else {
        enqueueWrite(() => updateSRS(word.card.id, isCorrect, isCramRef.current));
      }

      recordStudyToday();

      setStats((s) => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        incorrect: s.incorrect + (isCorrect ? 0 : 1),
        completed: s.completed + completed,
      }));

      cancelTimer();
      timerRef.current = setTimeout(advance, isCorrect ? CORRECT_DELAY_MS : INCORRECT_DELAY_MS);
    },
    [currentItem, feedback, advance, syncLevels, enqueueWrite, cancelTimer]
  );

  const selectOption = useCallback(
    (option: string) => {
      if (feedback || !currentItem) return;
      setSelectedOption(option);
      answer(option === getChoiceAnswer(currentItem));
    },
    [feedback, currentItem, answer]
  );

  const submitTyping = useCallback(
    (value: string) => {
      if (currentItem) answer(isTypingCorrect(currentItem.word.card, value));
    },
    [currentItem, answer]
  );

  const continueFlashcard = useCallback(() => answer(true), [answer]);

  // ── Bắt đầu phiên ──
  const startLearn = useCallback(() => {
    isCramRef.current = false;
    const fresh = pickNewCards(cardsRef.current);
    if (fresh.length === 0) {
      alert("Tất cả thẻ đã được học xong! Hãy thêm thẻ mới hoặc ôn tập.");
      return;
    }
    batchRef.current = fresh.map((card) => ({ card, sessionLevel: card.growthLevel }));
    setStats(EMPTY_STATS);
    syncLevels();
    changePhase("learn");
    showItem(buildLearnQuestion(batchRef.current, cardsRef.current, ++uidRef.current));
  }, [syncLevels, changePhase, showItem]);

  const startReview = useCallback(
    (limit: number | "all" = 10) => {
      const cardsToReview = pickLearnedCards(cardsRef.current, limit);
      if (cardsToReview.length === 0) {
        alert("Chưa có từ nào để ôn tập!");
        return;
      }
      isCramRef.current = true;
      const queue = shuffleArray(cardsToReview).map((card) =>
        buildReviewItem(card, cardsRef.current, ++uidRef.current)
      );
      reviewRef.current = { queue, index: 0 };
      setReviewPosition({ current: 1, total: queue.length });
      setStats(EMPTY_STATS);
      changePhase("review");
      showItem(queue[0]);
    },
    [changePhase, showItem]
  );

  // ── Quay về màn chọn chế độ với số liệu mới nhất ──
  const refresh = useCallback(async () => {
    cancelTimer();
    await writeQueueRef.current; // đợi ghi DB xong để số liệu chính xác
    try {
      const all = await getCardsByFolder(folderId);
      if (all.length < MIN_CARDS) {
        alert("Cần ít nhất 4 thẻ để bắt đầu!");
        router.push(`/folders/${folderId}`);
        return;
      }
      cardsRef.current = all;
      setCounts({
        newCount: countNew(all),
        dueCount: countDue(all, Date.now()),
        learnedCount: countLearned(all),
      });
      showItem(null);
      changePhase("select-mode");
    } catch (error) {
      console.error("Lỗi tải lại dữ liệu:", error);
      alert("Không thể tải dữ liệu. Vui lòng thử lại.");
    }
  }, [folderId, router, cancelTimer, showItem, changePhase]);

  const exit = useCallback(() => {
    if (confirm("Bạn có chắc muốn thoát?")) void refresh();
  }, [refresh]);

  const goToFolder = useCallback(() => router.push(`/folders/${folderId}`), [router, folderId]);

  return {
    phase,
    counts,
    currentItem,
    feedback,
    selectedOption,
    levels,
    reviewPosition,
    stats,
    playAudio,
    startLearn,
    startReview,
    selectOption,
    submitTyping,
    continueFlashcard,
    refresh,
    exit,
    goToFolder,
  };
}
