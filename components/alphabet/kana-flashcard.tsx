"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  allKana,
  type KanaItem,
  type KanaType,
  type KanaGroup,
} from "@/data/kana-data";
import { playKanaAudio } from "@/lib/kana-audio";

interface KanaFlashcardProps {
  isMemorized: (id: string) => boolean;
  toggleMemorized: (id: string) => void;
}

export function KanaFlashcard({ isMemorized, toggleMemorized }: KanaFlashcardProps) {
  // Filter state
  const [selectedType, setSelectedType] = useState<"all" | KanaType>("all");
  const [selectedGroup, setSelectedGroup] = useState<"all" | KanaGroup>("all");
  const [memorizedFilter, setMemorizedFilter] = useState<"all" | "unlearned" | "learned">("all");

  // Flashcard interaction state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoAudio, setAutoAudio] = useState(true);
  const [playSpeed, setPlaySpeed] = useState<number>(3); // 3 seconds
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledSeed, setShuffledSeed] = useState(0);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filtered Kana List
  const filteredList = useMemo(() => {
    let list = [...allKana];

    if (selectedType !== "all") {
      list = list.filter((item) => item.type === selectedType);
    }

    if (selectedGroup !== "all") {
      list = list.filter((item) => item.group === selectedGroup);
    }

    if (memorizedFilter === "unlearned") {
      list = list.filter((item) => !isMemorized(item.id));
    } else if (memorizedFilter === "learned") {
      list = list.filter((item) => isMemorized(item.id));
    }

    if (isShuffled) {
      // Deterministic shuffle with seed
      let s = shuffledSeed;
      list = [...list].sort(() => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280 - 0.5;
      });
    }

    return list;
  }, [selectedType, selectedGroup, memorizedFilter, isShuffled, isMemorized, shuffledSeed]);

  // Derived safe index to prevent out-of-bounds without triggering setState in effects
  const safeIndex =
    filteredList.length > 0 && currentIndex >= filteredList.length ? 0 : currentIndex;
  const currentItem: KanaItem | undefined = filteredList[safeIndex];

  // Helper filter setters that reset index and flip state
  const handleSelectType = useCallback((type: "all" | KanaType) => {
    setSelectedType(type);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  const handleSelectGroup = useCallback((group: "all" | KanaGroup) => {
    setSelectedGroup(group);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  const handleSelectMemorizedFilter = useCallback(
    (filter: "all" | "unlearned" | "learned") => {
      setMemorizedFilter(filter);
      setCurrentIndex(0);
      setIsFlipped(false);
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setSelectedType("all");
    setSelectedGroup("all");
    setMemorizedFilter("all");
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  // Play audio for current kana
  const handlePlayAudio = useCallback(
    (textToPlay?: string) => {
      if (textToPlay) {
        playKanaAudio(textToPlay);
      } else if (currentItem) {
        playKanaAudio(currentItem.kana);
      }
    },
    [currentItem]
  );

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (filteredList.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => {
      const idx = prev >= filteredList.length ? 0 : prev;
      return (idx + 1) % filteredList.length;
    });
  }, [filteredList.length]);

  const handlePrev = useCallback(() => {
    if (filteredList.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => {
      const idx = prev >= filteredList.length ? 0 : prev;
      return (idx - 1 + filteredList.length) % filteredList.length;
    });
  }, [filteredList.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleShuffle = () => {
    setIsShuffled((prev) => !prev);
    setShuffledSeed(Date.now());
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Auto pronounce on card change if enabled
  useEffect(() => {
    if (currentItem && autoAudio && !autoPlay) {
      // Nhẹ nhàng phát âm khi lật sang thẻ mới
      const timer = setTimeout(() => {
        handlePlayAudio(currentItem.kana);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentItem, autoAudio, autoPlay, handlePlayAudio]);

  // Auto-play slideshow effect
  useEffect(() => {
    if (!autoPlay || filteredList.length === 0) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      setIsFlipped(false);
      setCurrentIndex((prev) => {
        const next = (prev + 1) % filteredList.length;
        if (autoAudio && filteredList[next]) {
          setTimeout(() => playKanaAudio(filteredList[next].kana), 200);
        }
        return next;
      });
    }, playSpeed * 1000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, filteredList, playSpeed, autoAudio]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        handlePrev();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        handlePlayAudio();
      } else if (e.code === "KeyM" && currentItem) {
        e.preventDefault();
        toggleMemorized(currentItem.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handlePlayAudio, currentItem, toggleMemorized]);

  // Current stats
  const memorizedCountInSelection = useMemo(() => {
    return filteredList.filter((item) => isMemorized(item.id)).length;
  }, [filteredList, isMemorized]);

  const percentMemorized =
    filteredList.length > 0
      ? Math.round((memorizedCountInSelection / filteredList.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ══════════ BỘ LỌC TÙY CHỌN ══════════ */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-lg space-y-4">
        {/* Hàng 1: Loại chữ & Nhóm âm */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Chọn bảng chữ cái */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/80 border border-border/60">
            <button
              type="button"
              onClick={() => handleSelectType("all")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                selectedType === "all"
                  ? "bg-indigo text-white shadow-sm"
                  : "text-foreground-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              Tất cả (208)
            </button>
            <button
              type="button"
              onClick={() => handleSelectType("hiragana")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                selectedType === "hiragana"
                  ? "bg-sakura text-white shadow-sm"
                  : "text-foreground-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              Hiragana (ひらがな)
            </button>
            <button
              type="button"
              onClick={() => handleSelectType("katakana")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                selectedType === "katakana"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-foreground-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              Katakana (カタカナ)
            </button>
          </div>

          {/* Chọn nhóm âm */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectGroup("all")}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                selectedGroup === "all"
                  ? "border-indigo bg-indigo/15 text-indigo-light font-bold"
                  : "border-border/60 text-foreground-muted hover:bg-surface"
              }`}
            >
              Tất cả âm
            </button>
            <button
              type="button"
              onClick={() => handleSelectGroup(selectedType === "katakana" ? "katakana" : "hiragana")}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                selectedGroup === "hiragana" || selectedGroup === "katakana"
                  ? "border-sakura bg-sakura/15 text-sakura-light font-bold"
                  : "border-border/60 text-foreground-muted hover:bg-surface"
              }`}
            >
              Cơ bản (46 chữ)
            </button>
            <button
              type="button"
              onClick={() => handleSelectGroup("dakuten")}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                selectedGroup === "dakuten"
                  ? "border-emerald bg-emerald/15 text-emerald-400 font-bold"
                  : "border-border/60 text-foreground-muted hover:bg-surface"
              }`}
            >
              Âm đục & Bán đục (゛/ ゜)
            </button>
            <button
              type="button"
              onClick={() => handleSelectGroup("youon")}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                selectedGroup === "youon"
                  ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold"
                  : "border-border/60 text-foreground-muted hover:bg-surface"
              }`}
            >
              Âm ghép (ゃ/ゅ/ょ)
            </button>
          </div>
        </div>

        {/* Hàng 2: Trạng thái thuộc & Tiện ích */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
          {/* Lọc theo ghi nhớ */}
          <div className="flex items-center gap-1.5">
            <span className="text-foreground-muted font-medium">Trạng thái:</span>
            <button
              type="button"
              onClick={() => handleSelectMemorizedFilter("all")}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                memorizedFilter === "all"
                  ? "bg-surface font-bold text-foreground border border-border"
                  : "text-foreground-dim hover:text-foreground"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => handleSelectMemorizedFilter("unlearned")}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                memorizedFilter === "unlearned"
                  ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                  : "text-foreground-dim hover:text-foreground"
              }`}
            >
              🌱 Chưa thuộc ({filteredList.length - memorizedCountInSelection})
            </button>
            <button
              type="button"
              onClick={() => handleSelectMemorizedFilter("learned")}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                memorizedFilter === "learned"
                  ? "bg-emerald/20 text-emerald-400 font-bold border border-emerald/40"
                  : "text-foreground-dim hover:text-foreground"
              }`}
            >
              ✨ Đã thuộc ({memorizedCountInSelection})
            </button>
          </div>

          {/* Công cụ hỗ trợ */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                isShuffled
                  ? "border-indigo bg-indigo/20 text-indigo-light"
                  : "border-border/60 text-foreground-muted hover:bg-surface hover:text-foreground"
              }`}
              title="Xáo trộn ngẫu nhiên thứ tự thẻ"
            >
              <span>🔀</span> Xáo trộn
            </button>

            <button
              type="button"
              onClick={() => setAutoAudio(!autoAudio)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                autoAudio
                  ? "border-emerald/40 bg-emerald/15 text-emerald-400"
                  : "border-border/60 text-foreground-dim hover:bg-surface"
              }`}
              title="Tự động phát âm khi sang thẻ mới"
            >
              <span>🔊</span> Tự phát âm: {autoAudio ? "Bật" : "Tắt"}
            </button>

            <button
              type="button"
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                autoPlay
                  ? "border-rose/50 bg-rose/15 text-rose animate-pulse"
                  : "border-border/60 text-foreground-muted hover:bg-surface hover:text-foreground"
              }`}
              title="Tự động lướt thẻ trình chiếu"
            >
              <span>{autoPlay ? "⏸️ Dừng chạy" : "▶️ Tự chạy"}</span>
            </button>

            {autoPlay && (
              <select
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
                className="bg-surface border border-border rounded-lg px-2 py-0.5 text-xs text-foreground cursor-pointer"
              >
                <option value={2}>2s</option>
                <option value={3}>3s</option>
                <option value={5}>5s</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ FLASHCARD 3D CHÍNH ══════════ */}
      {filteredList.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-border/80">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            Không có thẻ nào phù hợp với bộ lọc này
          </h3>
          <p className="text-xs sm:text-sm text-foreground-muted mb-4">
            Bạn đã thuộc hết các chữ trong nhóm này hoặc bộ lọc quá hẹp!
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 bg-indigo text-white font-bold rounded-xl text-xs hover:bg-indigo-dark transition-all cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : currentItem ? (
        <div className="flex flex-col items-center">
          {/* Thanh chỉ báo thẻ & Tiến độ */}
          <div className="w-full max-w-md flex items-center justify-between text-xs font-bold text-foreground-muted mb-2 px-1">
            <span>
              Thẻ {safeIndex + 1} / {filteredList.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-mono">
                {percentMemorized}% đã thuộc
              </span>
              <div className="w-20 h-2 bg-surface rounded-full overflow-hidden border border-border/60">
                <div
                  className="h-full bg-gradient-to-r from-emerald to-teal-400 transition-all duration-300"
                  style={{ width: `${percentMemorized}%` }}
                />
              </div>
            </div>
          </div>

          {/* Khung thẻ 3D Flip */}
          <div className="perspective-1000 w-full max-w-md h-88 sm:h-96">
            <div
              className={`flip-card-inner cursor-pointer select-none relative ${
                isFlipped ? "flipped" : ""
              }`}
              onClick={handleFlip}
              title="Click hoặc bấm phím Space để lật thẻ"
            >
              {/* ── MẶT TRƯỚC (Kana) ── */}
              <div className="flip-card-front glass-card p-6 sm:p-8 rounded-3xl border-2 border-indigo/25 shadow-2xl flex flex-col justify-between overflow-hidden relative group">
                <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-sakura via-indigo to-emerald opacity-70" />

                {/* Top header mặt trước */}
                <div className="w-full flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-surface/90 border border-border/80 text-foreground-muted">
                    <span className="w-2 h-2 rounded-full bg-indigo animate-pulse" />
                    {currentItem.type === "hiragana" ? "Hiragana" : "Katakana"} •{" "}
                    {currentItem.group === "hiragana" || currentItem.group === "katakana"
                      ? "Cơ bản"
                      : currentItem.group === "dakuten"
                      ? "Âm đục"
                      : "Âm ghép"}
                  </span>

                  {/* Nút đánh dấu đã thuộc */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMemorized(currentItem.id);
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isMemorized(currentItem.id)
                        ? "bg-emerald/20 text-emerald-400 border border-emerald/40 shadow-xs"
                        : "bg-surface/70 text-foreground-dim hover:text-foreground border border-border hover:border-amber-400/50"
                    }`}
                    title={isMemorized(currentItem.id) ? "Bỏ đánh dấu đã thuộc" : "Đánh dấu đã thuộc"}
                  >
                    <span>{isMemorized(currentItem.id) ? "✨ Đã thuộc" : "☆ Đánh dấu"}</span>
                  </button>
                </div>

                {/* Ký tự Kana khổng lồ trung tâm */}
                <div className="flex flex-col items-center justify-center my-auto">
                  <div className="kana-display text-7xl sm:text-8xl md:text-9xl font-black text-foreground drop-shadow-md hover:scale-105 transition-transform duration-200">
                    {currentItem.kana}
                  </div>

                  {/* Gợi ý cách đọc gần gũi */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-foreground-dim">
                      Phát âm: <strong className="text-foreground">{currentItem.vietnamese}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio();
                      }}
                      className="p-1.5 rounded-xl bg-indigo/15 text-indigo-light hover:bg-indigo hover:text-white transition-all cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Footer lật thẻ */}
                <div className="w-full text-center">
                  <span className="text-[11px] font-medium text-foreground-dim inline-flex items-center gap-1 bg-surface/50 px-3 py-1 rounded-full border border-border/40">
                    <span>↻</span> Chạm để xem Romaji & Từ ví dụ
                  </span>
                </div>
              </div>

              {/* ── MẶT SAU (Romaji & Ví dụ) ── */}
              <div className="flip-card-back glass-card p-6 sm:p-7 rounded-3xl border-2 border-sakura/30 shadow-2xl flex flex-col justify-between overflow-hidden relative">
                <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-emerald via-indigo to-sakura opacity-70" />

                {/* Top header mặt sau */}
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-foreground-muted">
                    {currentItem.kana} ➔
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMemorized(currentItem.id);
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isMemorized(currentItem.id)
                        ? "bg-emerald/20 text-emerald-400 border border-emerald/40"
                        : "bg-surface text-foreground-dim hover:text-foreground border border-border"
                    }`}
                  >
                    <span>{isMemorized(currentItem.id) ? "✨ Đã thuộc" : "☆ Đánh dấu"}</span>
                  </button>
                </div>

                {/* Nội dung trung tâm: Romaji & Ví dụ thực tế */}
                <div className="w-full space-y-3.5 my-auto">
                  {/* Romaji lớn */}
                  <div className="text-center">
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-indigo-light drop-shadow-sm">
                      /{currentItem.romaji}/
                    </span>
                    <p className="text-xs text-foreground-muted mt-1 font-medium">
                      Cách đọc tiếng Việt: <strong>{currentItem.vietnamese}</strong>
                    </p>
                  </div>

                  {/* Hộp từ vựng ví dụ thực tế */}
                  <div className="rounded-2xl bg-surface/90 border border-border/80 p-3 sm:p-4 text-left shadow-inner">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-foreground-dim uppercase tracking-wider">
                        Từ vựng mẫu
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(currentItem.example.word);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald transition-colors cursor-pointer"
                        title="Nghe phát âm từ ví dụ"
                      >
                        <span>🔊</span> Nghe từ
                      </button>
                    </div>

                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-black text-foreground kana-display">
                        {currentItem.example.word}
                      </span>
                      {currentItem.example.kanji && (
                        <span className="text-xs font-bold text-sakura-light">
                          ({currentItem.example.kanji})
                        </span>
                      )}
                      <span className="text-xs font-mono text-indigo-light">
                        [{currentItem.example.romaji}]
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-emerald-400 mt-1">
                      ➔ {currentItem.example.meaning}
                    </p>
                  </div>

                  {/* Mẹo nhớ hình dáng (nếu có) */}
                  {currentItem.mnemonic && (
                    <div className="text-[11px] text-foreground-dim bg-surface/40 p-2.5 rounded-xl border border-border/40 text-center">
                      💡 <strong>Mẹo nhớ:</strong> {currentItem.mnemonic}
                    </div>
                  )}
                </div>

                {/* Footer lật thẻ */}
                <div className="w-full text-center">
                  <span className="text-[11px] font-medium text-foreground-dim inline-flex items-center gap-1 bg-surface/50 px-3 py-1 rounded-full border border-border/40">
                    <span>↻</span> Chạm để quay lại mặt chữ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════ THANH ĐIỀU KHIỂN DƯỚI ══════════ */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
            {/* Nút Trước */}
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-surface/90 border border-border/80 text-foreground hover:bg-surface-hover hover:border-indigo/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
              title="Thẻ trước (Phím ← hoặc A)"
              aria-label="Thẻ trước"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Nút Phát âm */}
            <button
              type="button"
              onClick={() => handlePlayAudio()}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo/15 border border-indigo/30 text-indigo-light hover:bg-indigo hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
              title="Phát âm chữ cái (Phím R)"
              aria-label="Phát âm"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

            {/* Nút Lật Thẻ chính */}
            <button
              type="button"
              onClick={handleFlip}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sakura to-indigo text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo/25 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              title="Lật thẻ (Phím Space hoặc Enter)"
            >
              <span>↻</span>
              <span>{isFlipped ? "Xem Chữ" : "Lật Romaji"}</span>
            </button>

            {/* Nút Tiếp Theo */}
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-surface/90 border border-border/80 text-foreground hover:bg-surface-hover hover:border-indigo/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
              title="Thẻ kế tiếp (Phím → hoặc D)"
              aria-label="Thẻ tiếp"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Phím tắt gợi ý */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-foreground-dim">
            <span>
              Phím <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[10px]">Space</kbd>: Lật thẻ
            </span>
            <span>
              Phím <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[10px]">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[10px]">→</kbd>: Trước/Sau
            </span>
            <span>
              Phím <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[10px]">R</kbd>: Nghe lại
            </span>
            <span>
              Phím <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[10px]">M</kbd>: Thuộc/Chưa thuộc
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
