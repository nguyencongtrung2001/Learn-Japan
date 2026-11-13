"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  allKana,
  type KanaItem,
  type KanaType,
  type KanaGroup,
} from "@/data/kana-data";
import { playKanaAudio } from "@/lib/kana-audio";

type QuizMode = "kana-to-romaji" | "romaji-to-kana" | "typing";

interface Question {
  item: KanaItem;
  options: string[]; // 4 choices (either romajis or kanas)
  correctAnswer: string;
}

export function KanaQuiz() {
  // Quiz setup settings
  const [quizMode, setQuizMode] = useState<QuizMode>("kana-to-romaji");
  const [selectedType, setSelectedType] = useState<"all" | KanaType>("all");
  const [selectedGroup, setSelectedGroup] = useState<"all" | KanaGroup>("all");
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [timeLimit, setTimeLimit] = useState<number>(10); // 0 = no limit, 5, 10, 15

  // Quiz active state
  const [isPlaying, setIsPlaying] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typingInput, setTypingInput] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [wrongItems, setWrongItems] = useState<{ item: KanaItem; userAnswer: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pool of available items based on type & group filters
  const candidatePool = useMemo(() => {
    let pool = [...allKana];
    if (selectedType !== "all") {
      pool = pool.filter((item) => item.type === selectedType);
    }
    if (selectedGroup !== "all") {
      pool = pool.filter((item) => item.group === selectedGroup);
    }
    return pool;
  }, [selectedType, selectedGroup]);

  // Generate questions generator
  const generateQuestions = useCallback(
    (customPool?: KanaItem[]): Question[] => {
      const pool = customPool && customPool.length > 0 ? customPool : candidatePool;
      if (pool.length === 0) return [];

      // Shuffle pool
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const count = Math.min(questionCount, shuffled.length);
      const selected = shuffled.slice(0, count);

      return selected.map((item) => {
        const isKanaQuestion = quizMode === "kana-to-romaji" || quizMode === "typing";
        const correctAnswer = isKanaQuestion ? item.romaji : item.kana;

        // Generate 3 distractors
        const otherItems = pool.filter((other) => other.id !== item.id);
        const shuffledOthers = [...otherItems].sort(() => Math.random() - 0.5);
        const distractors = shuffledOthers.slice(0, 3).map((d) => (isKanaQuestion ? d.romaji : d.kana));

        // Combine and shuffle options
        const options = [...distractors, correctAnswer].sort(() => Math.random() - 0.5);

        return {
          item,
          options,
          correctAnswer,
        };
      });
    },
    [candidatePool, questionCount, quizMode]
  );

  // Start new quiz
  const startQuiz = useCallback(
    (customPool?: KanaItem[]) => {
      const generated = generateQuestions(customPool);
      if (generated.length === 0) {
        alert("Không đủ chữ cái để tạo bài kiểm tra. Vui lòng chọn phạm vi rộng hơn.");
        return;
      }
      setQuestions(generated);
      setCurrentIndex(0);
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setWrongItems([]);
      setSelectedAnswer(null);
      setTypingInput("");
      setIsAnswered(false);
      setIsFinished(false);
      setIsPlaying(true);
      setTimeLeft(timeLimit);
    },
    [generateQuestions, timeLimit]
  );

  const currentQ = questions[currentIndex];

  // Answer submit logic
  const handleAnswer = useCallback(
    (answer: string) => {
      if (isAnswered || !currentQ) return;
      if (timerRef.current) clearInterval(timerRef.current);

      setIsAnswered(true);
      setSelectedAnswer(answer);

      const isCorrect =
        answer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        setScore((prev) => prev + 1);
        setStreak((prev) => {
          const next = prev + 1;
          setMaxStreak((m) => Math.max(m, next));
          return next;
        });
        playKanaAudio(currentQ.item.kana);
      } else {
        setStreak(0);
        setWrongItems((prev) => [...prev, { item: currentQ.item, userAnswer: answer }]);
      }

      // Auto advance to next question
      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex((prev) => prev + 1);
          setIsAnswered(false);
          setSelectedAnswer(null);
          setTypingInput("");
          setTimeLeft(timeLimit);
        } else {
          setIsFinished(true);
          setIsPlaying(false);
        }
      }, 900);
    },
    [isAnswered, currentQ, currentIndex, questions.length, timeLimit]
  );

  // Focus input in typing mode
  useEffect(() => {
    if (isPlaying && quizMode === "typing" && !isAnswered) {
      inputRef.current?.focus();
    }
  }, [isPlaying, quizMode, currentIndex, isAnswered]);

  // Timer logic for each question
  useEffect(() => {
    if (!isPlaying || isAnswered || timeLimit === 0 || isFinished) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAnswer(""); // Hết giờ = coi như trả lời sai
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isAnswered, timeLimit, isFinished, handleAnswer]);

  return (
    <div className="space-y-6">
      {/* ══════════ MÀN HÌNH CÀI ĐẶT QUIZ (KHI CHƯA CHƠI) ══════════ */}
      {!isPlaying && !isFinished && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-border/80 shadow-2xl space-y-6 max-w-2xl mx-auto animate-fade-in">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black gradient-text flex items-center justify-center gap-2">
              <span>⚡</span> Luyện Phản Xạ Bảng Chữ Cái
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Kiểm tra khả năng nhận diện mặt chữ, nhớ phiên âm Romaji và phản xạ gõ phím tiếng Nhật
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* 1. Chọn kiểu bài kiểm tra */}
            <div>
              <label className="block font-bold text-foreground mb-2">
                1. Kiểu bài tập:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setQuizMode("kana-to-romaji")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    quizMode === "kana-to-romaji"
                      ? "border-indigo bg-indigo/15 text-indigo-light shadow-md"
                      : "border-border/60 bg-surface/60 text-foreground-muted hover:bg-surface"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <span>🈸 ➔ ABC</span>
                  </div>
                  <div className="text-[11px] opacity-80">
                    Nhìn chữ Kana, chọn đáp án Romaji tương ứng
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuizMode("romaji-to-kana")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    quizMode === "romaji-to-kana"
                      ? "border-sakura bg-sakura/15 text-sakura-light shadow-md"
                      : "border-border/60 bg-surface/60 text-foreground-muted hover:bg-surface"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <span>ABC ➔ 🈸</span>
                  </div>
                  <div className="text-[11px] opacity-80">
                    Nhìn phiên âm Romaji, chọn chữ Kana đúng
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuizMode("typing")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    quizMode === "typing"
                      ? "border-emerald bg-emerald/15 text-emerald-400 shadow-md"
                      : "border-border/60 bg-surface/60 text-foreground-muted hover:bg-surface"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <span>⌨️ Gõ Romaji</span>
                  </div>
                  <div className="text-[11px] opacity-80">
                    Nhìn Kana và tự gõ Romaji bằng bàn phím
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Chọn loại bảng chữ cái */}
            <div>
              <label className="block font-bold text-foreground mb-2">
                2. Loại chữ:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedType("all")}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    selectedType === "all"
                      ? "border-indigo bg-indigo text-white"
                      : "border-border/60 bg-surface text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Cả hai bảng
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType("hiragana")}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    selectedType === "hiragana"
                      ? "border-sakura bg-sakura text-white"
                      : "border-border/60 bg-surface text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Chỉ Hiragana
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType("katakana")}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    selectedType === "katakana"
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-border/60 bg-surface text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Chỉ Katakana
                </button>
              </div>
            </div>

            {/* 3. Nhóm âm */}
            <div>
              <label className="block font-bold text-foreground mb-2">
                3. Nhóm âm cần luyện:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGroup("all")}
                  className={`py-2 px-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    selectedGroup === "all"
                      ? "border-indigo bg-indigo/20 text-indigo-light"
                      : "border-border/60 bg-surface text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Tất cả nhóm
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGroup(selectedType === "katakana" ? "katakana" : "hiragana")}
                  className={`py-2 px-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    selectedGroup === "hiragana" || selectedGroup === "katakana"
                      ? "border-sakura bg-sakura/20 text-sakura-light"
                      : "border-border/60 bg-surface text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Cơ bản (46 chữ)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGroup("dakuten")}
                  className={`py-2 px-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    selectedGroup === "dakuten"
                      ? "border-emerald bg-emerald/20 text-emerald-400"
                      : "border-border/60 bg-surface text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Âm đục (゛/ ゜)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGroup("youon")}
                  className={`py-2 px-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    selectedGroup === "youon"
                      ? "border-amber-500 bg-amber-500/20 text-amber-300"
                      : "border-border/60 bg-surface text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Âm ghép (ゃ/ゅ/ょ)
                </button>
              </div>
            </div>

            {/* 4. Số câu hỏi & Thời gian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  Số lượng câu:
                </label>
                <div className="flex items-center gap-2">
                  {[10, 20, 30, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        questionCount === num
                          ? "border-indigo bg-indigo text-white"
                          : "border-border/60 bg-surface text-foreground-muted hover:text-foreground"
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  Thời gian mỗi câu:
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { label: "Vô hạn", val: 0 },
                    { label: "15s", val: 15 },
                    { label: "10s", val: 10 },
                    { label: "5s (Nhanh)", val: 5 },
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setTimeLimit(t.val)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        timeLimit === t.val
                          ? "border-emerald bg-emerald text-white"
                          : "border-border/60 bg-surface text-foreground-muted hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => startQuiz()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald via-teal-500 to-indigo text-white font-black text-base shadow-xl shadow-emerald/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🚀</span> Bắt Đầu Bài Kiểm Tra ({candidatePool.length} chữ trong phạm vi)
            </button>
          </div>
        </div>
      )}

      {/* ══════════ MÀN HÌNH ĐANG LÀM QUIZ ══════════ */}
      {isPlaying && currentQ && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-border/80 shadow-2xl max-w-xl mx-auto space-y-6 animate-fade-in">
          {/* Header tiến độ, streak, timer */}
          <div className="flex items-center justify-between gap-3 text-xs font-bold">
            <span className="text-foreground-muted">
              Câu {currentIndex + 1} / {questions.length}
            </span>

            {/* Streak Counter */}
            <div className="flex items-center gap-1 text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
              <span>🔥</span>
              <span>Chuỗi đúng: {streak}</span>
            </div>

            {/* Điểm hiện tại */}
            <span className="text-emerald-400 font-mono">
              Điểm: {score}
            </span>
          </div>

          {/* Thanh thời gian nếu bật timer */}
          {timeLimit > 0 && (
            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border/60">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft <= 3 ? "bg-rose animate-pulse" : "bg-indigo"
                }`}
                style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
              />
            </div>
          )}

          {/* Câu hỏi trung tâm */}
          <div className="text-center py-6 sm:py-8 space-y-3 bg-surface/50 rounded-3xl border border-border/60 relative overflow-hidden">
            <span className="text-xs font-bold text-foreground-dim uppercase tracking-wider">
              {quizMode === "romaji-to-kana" ? "Phiên âm Romaji" : "Ký tự tiếng Nhật"}
            </span>

            {/* Ký tự câu hỏi */}
            <div className="flex items-center justify-center gap-3">
              <div
                className={`text-6xl sm:text-7xl font-black text-foreground drop-shadow-md ${
                  quizMode === "romaji-to-kana" ? "font-mono" : "kana-display"
                }`}
              >
                {quizMode === "romaji-to-kana" ? currentQ.item.romaji : currentQ.item.kana}
              </div>

              {/* Nút phát âm */}
              <button
                type="button"
                onClick={() => playKanaAudio(currentQ.item.kana)}
                className="p-2.5 rounded-2xl bg-indigo/15 text-indigo-light hover:bg-indigo hover:text-white transition-all cursor-pointer"
                title="Nghe phát âm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-foreground-muted">
              {quizMode === "typing"
                ? "Gõ Romaji tương ứng bên dưới rồi bấm Enter:"
                : quizMode === "romaji-to-kana"
                ? "Chọn chữ Kana tương ứng:"
                : "Chọn cách đọc Romaji đúng:"}
            </p>
          </div>

          {/* Đáp án: Trắc nghiệm 4 lựa chọn */}
          {quizMode !== "typing" ? (
            <div className="grid grid-cols-2 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === currentQ.correctAnswer;

                let btnStyle =
                  "border-border/80 bg-surface/70 text-foreground hover:border-indigo hover:bg-surface-hover";

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = "border-emerald bg-emerald/20 text-emerald-400 font-black correct-glow";
                  } else if (isSelected && !isCorrect) {
                    btnStyle = "border-rose bg-rose/20 text-rose font-bold incorrect-glow";
                  } else {
                    btnStyle = "opacity-40 border-border bg-surface text-foreground-dim";
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleAnswer(opt)}
                    className={`p-4 rounded-2xl border-2 text-xl sm:text-2xl font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${btnStyle} ${
                      quizMode === "romaji-to-kana" ? "kana-display" : "font-mono"
                    }`}
                  >
                    <span>{opt}</span>
                    {isAnswered && isCorrect && <span>✓</span>}
                    {isAnswered && isSelected && !isCorrect && <span>✗</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Đáp án: Gõ chữ (Typing Mode) */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typingInput.trim()) {
                  handleAnswer(typingInput.trim());
                }
              }}
              className="space-y-3"
            >
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={typingInput}
                  disabled={isAnswered}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTypingInput(val);
                    // Tự động nộp nếu gõ khớp chính xác
                    if (val.trim().toLowerCase() === currentQ.correctAnswer.toLowerCase()) {
                      handleAnswer(val.trim());
                    }
                  }}
                  placeholder="Gõ Romaji vào đây (VD: ka, shi, kyo)..."
                  className={`w-full py-4 px-5 rounded-2xl border-2 text-center text-xl font-mono font-bold outline-none transition-all ${
                    isAnswered
                      ? typingInput.trim().toLowerCase() === currentQ.correctAnswer.toLowerCase()
                        ? "border-emerald bg-emerald/15 text-emerald-400"
                        : "border-rose bg-rose/15 text-rose"
                      : "border-border bg-surface/80 text-foreground focus:border-indigo focus:ring-4 focus:ring-indigo/10"
                  }`}
                  autoComplete="off"
                  autoCapitalize="off"
                />
              </div>

              {isAnswered && (
                <div className="text-center text-xs font-semibold animate-fade-in">
                  Đáp án đúng:{" "}
                  <strong className="text-emerald-400 font-mono text-sm">
                    {currentQ.correctAnswer}
                  </strong>
                </div>
              )}

              <button
                type="submit"
                disabled={isAnswered || !typingInput.trim()}
                className="w-full py-3 rounded-xl bg-indigo text-white font-bold text-sm disabled:opacity-50 transition-all cursor-pointer"
              >
                Kiểm tra (Enter)
              </button>
            </form>
          )}

          {/* Thoát kiểm tra */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                if (confirm("Bạn có muốn dừng bài kiểm tra này?")) {
                  setIsPlaying(false);
                  setIsFinished(false);
                }
              }}
              className="text-xs text-foreground-dim hover:text-rose transition-colors cursor-pointer"
            >
              ✕ Dừng bài kiểm tra
            </button>
          </div>
        </div>
      )}

      {/* ══════════ MÀN HÌNH KẾT QUẢ TỔNG KẾT ══════════ */}
      {isFinished && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-border/80 shadow-2xl max-w-xl mx-auto space-y-6 text-center animate-fade-in">
          <div className="text-5xl mb-1">
            {score === questions.length ? "🏆" : score >= questions.length * 0.8 ? "🎉" : "💪"}
          </div>

          <div>
            <h3 className="text-2xl font-black text-foreground">
              {score === questions.length
                ? "Xuất sắc! Bạn đúng 100%!"
                : score >= questions.length * 0.8
                ? "Làm rất tốt! Tiếp tục phát huy!"
                : "Hoàn thành bài luyện tập!"}
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Bạn đã trả lời đúng {score} trên tổng số {questions.length} câu hỏi.
            </p>
          </div>

          {/* Hộp điểm số */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface/70 border border-border/60">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {Math.round((score / questions.length) * 100)}%
              </div>
              <div className="text-[11px] text-foreground-dim font-semibold">Độ chính xác</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-light font-mono">
                {score}/{questions.length}
              </div>
              <div className="text-[11px] text-foreground-dim font-semibold">Số câu đúng</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {maxStreak} 🔥
              </div>
              <div className="text-[11px] text-foreground-dim font-semibold">Chuỗi đúng dài nhất</div>
            </div>
          </div>

          {/* Danh sách các câu làm sai (nếu có) */}
          {wrongItems.length > 0 && (
            <div className="text-left space-y-2.5">
              <h4 className="text-xs font-bold text-foreground-dim uppercase flex items-center justify-between">
                <span>Cần ôn lại ({wrongItems.length} chữ):</span>
                <span className="text-[10px] text-rose">Chạm để nghe phát âm</span>
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {wrongItems.map((w, idx) => (
                  <div
                    key={idx}
                    onClick={() => playKanaAudio(w.item.kana)}
                    className="p-2.5 rounded-xl bg-surface border border-rose/30 flex items-center justify-between cursor-pointer hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="kana-display text-2xl font-bold text-foreground">
                        {w.item.kana}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-light">
                        /{w.item.romaji}/
                      </span>
                      <span className="text-xs text-foreground-dim">
                        ({w.item.example.meaning})
                      </span>
                    </div>
                    <span className="text-xs text-rose font-mono">
                      {w.userAnswer ? `Bạn chọn: ${w.userAnswer}` : "Hết giờ"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Các nút hành động */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {wrongItems.length > 0 && (
              <button
                type="button"
                onClick={() => startQuiz(wrongItems.map((w) => w.item))}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                🔄 Luyện lại {wrongItems.length} câu sai
              </button>
            )}

            <button
              type="button"
              onClick={() => startQuiz()}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sakura to-indigo text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              🚀 Làm bài mới
            </button>

            <button
              type="button"
              onClick={() => {
                setIsFinished(false);
                setIsPlaying(false);
              }}
              className="w-full sm:w-auto py-3 px-4 rounded-xl border border-border text-foreground-muted hover:text-foreground text-xs font-semibold cursor-pointer"
            >
              Cài đặt lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
