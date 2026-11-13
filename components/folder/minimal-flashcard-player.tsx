"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { CardListItem } from "@/lib/card-utils";
import type { Folder } from "@/db/schema";

interface MinimalFlashcardPlayerProps {
  folder: Folder;
  cards: CardListItem[];
  onBackToClassic?: () => void;
  // External index control for Split-View synchronization
  externalIndex?: number;
  onCardChange?: (index: number) => void;
  isSplitView?: boolean;
}

export function MinimalFlashcardPlayer({
  folder,
  cards,
  onBackToClassic,
  externalIndex,
  onCardChange,
  isSplitView = false,
}: MinimalFlashcardPlayerProps) {
  // State
  const [internalIndex, setInternalIndex] = useState(externalIndex ?? 0);
  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex;

  const [isFlipped, setIsFlipped] = useState(false);
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  if (prevIndex !== currentIndex) {
    setPrevIndex(currentIndex);
    setIsFlipped(false);
  }
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledSeed, setShuffledSeed] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoAudio, setAutoAudio] = useState(true);
  const [playSpeed, setPlaySpeed] = useState<number>(3); // 3 seconds
  const [showFrontFirst, setShowFrontFirst] = useState<"term" | "def">("term");
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Starred cards (Local storage persistence per folder)
  const [starredIds, setStarredIds] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(`starred_cards_${folder.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [onlyStarred, setOnlyStarred] = useState(false);

  // Save starred IDs
  const toggleStar = useCallback(
    (id: number) => {
      setStarredIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        try {
          localStorage.setItem(
            `starred_cards_${folder.id}`,
            JSON.stringify(Array.from(next))
          );
        } catch {
          // ignore
        }
        return next;
      });
    },
    [folder.id]
  );

  // Filter & Shuffle list
  const activeList = useMemo(() => {
    let list = [...cards];
    if (onlyStarred) {
      list = list.filter((c) => starredIds.has(c.id));
    }
    if (isShuffled) {
      let s = shuffledSeed;
      list = [...list].sort(() => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280 - 0.5;
      });
    }
    return list;
  }, [cards, onlyStarred, starredIds, isShuffled, shuffledSeed]);

  // Derived safe index
  const safeIndex =
    activeList.length > 0 && currentIndex >= activeList.length ? 0 : currentIndex;
  const currentCard = activeList[safeIndex];

  // Notify parent onCardChange
  const handleIndexChange = useCallback(
    (newIdx: number) => {
      setInternalIndex(newIdx);
      setIsFlipped(false);
      onCardChange?.(newIdx);
    },
    [onCardChange]
  );

  // Audio player
  const playAudio = useCallback(
    (textToPlay?: string) => {
      if (typeof window === "undefined") return;
      const text = textToPlay || currentCard?.word;
      if (!text) return;

      const langCode = folder.language === "japanese" ? "ja-JP" : "en-US";
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = langCode;
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
          return;
        } catch {
          // fallback
        }
      }

      const audio = new Audio(
        `/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`
      );
      audio.play().catch(() => {});
    },
    [currentCard, folder.language]
  );

  // Auto audio on card change
  useEffect(() => {
    if (currentCard && autoAudio && !autoPlay) {
      const timer = setTimeout(() => {
        playAudio(currentCard.word);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentCard, autoAudio, autoPlay, playAudio]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (activeList.length === 0) return;
    const nextIdx = (safeIndex + 1) % activeList.length;
    handleIndexChange(nextIdx);
  }, [activeList.length, safeIndex, handleIndexChange]);

  const handlePrev = useCallback(() => {
    if (activeList.length === 0) return;
    const prevIdx = (safeIndex - 1 + activeList.length) % activeList.length;
    handleIndexChange(prevIdx);
  }, [activeList.length, safeIndex, handleIndexChange]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleShuffleToggle = () => {
    setIsShuffled((prev) => !prev);
    setShuffledSeed(Date.now());
    handleIndexChange(0);
  };

  // Slideshow autoPlay
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!autoPlay || activeList.length === 0) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      setIsFlipped(false);
      handleIndexChange((safeIndex + 1) % activeList.length);
    }, playSpeed * 1000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, activeList.length, playSpeed, safeIndex, handleIndexChange]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        playAudio();
      } else if (e.code === "KeyS" && currentCard) {
        e.preventDefault();
        toggleStar(currentCard.id);
      } else if (e.code === "KeyF") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, playAudio, currentCard, toggleStar]);

  // Mobile Touch Gestures (Swipe left/right, tap to flip)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Detect horizontal swipe if deltaX > 50 and horizontal movement > vertical
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext(); // Swipe left -> Next
      } else {
        handlePrev(); // Swipe right -> Prev
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  if (activeList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl mb-4 border border-gray-200">
          ⭐
        </div>
        <h3 className="text-xl font-bold text-[#1A1D28] mb-2">
          {onlyStarred
            ? "Không có thẻ nào được gắn sao"
            : "Chưa có thẻ từ vựng nào"}
        </h3>
        <p className="text-sm text-[#586380] max-w-md mb-6">
          {onlyStarred
            ? "Bạn chưa đánh dấu sao cho thẻ nào. Hãy gắn sao các từ khó để ôn tập riêng!"
            : "Bộ thẻ này hiện chưa có từ vựng nào để học."}
        </p>
        <div className="flex items-center gap-3">
          {onlyStarred && (
            <button
              type="button"
              onClick={() => setOnlyStarred(false)}
              className="px-5 py-2.5 rounded-xl bg-[#4255FF] text-white font-semibold text-sm hover:bg-[#3344dd] transition-all cursor-pointer shadow-md"
            >
              Học tất cả các thẻ
            </button>
          )}
          {onBackToClassic && (
            <button
              type="button"
              onClick={onBackToClassic}
              className="px-5 py-2.5 rounded-xl bg-white border border-gray-300 text-[#1A1D28] font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer"
            >
              Về giao diện quản lý
            </button>
          )}
        </div>
      </div>
    );
  }

  const isStarred = currentCard ? starredIds.has(currentCard.id) : false;
  const progressPercent = Math.round(
    ((safeIndex + 1) / activeList.length) * 100
  );

  // Content font scaling based on length
  const termLength = currentCard?.word.length || 0;
  const termFontSize =
    termLength > 20
      ? "text-2xl sm:text-3xl"
      : termLength > 10
      ? "text-3xl sm:text-4xl"
      : "text-4xl sm:text-5xl";

  const defLength = currentCard?.translation.length || 0;
  const defFontSize =
    defLength > 40
      ? "text-xl sm:text-2xl"
      : defLength > 20
      ? "text-2xl sm:text-3xl"
      : "text-3xl sm:text-4xl";

  // Card front / back switch
  const frontContent = showFrontFirst === "term" ? "term" : "def";
  const isFront = !isFlipped;
  const showingTerm =
    (frontContent === "term" && isFront) || (frontContent === "def" && !isFront);

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] flex flex-col justify-between selection:bg-[#4255FF]/20 ${
        isSplitView ? "" : "max-w-5xl mx-auto px-4 sm:px-6 py-4"
      }`}
      style={{
        backgroundColor: isSplitView ? "transparent" : "#F6F7FB",
        color: "#1A1D28",
      }}
    >
      {/* ════════════════════════════════════════════════════════════
          KHU VỰC 1: TOP BAR (10 - 15% KHÔNG GIAN DỌC)
          ════════════════════════════════════════════════════════════ */}
      <header className="w-full pb-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* Top-Left: [< Quay lại] & Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            {onBackToClassic && (
              <button
                type="button"
                onClick={onBackToClassic}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#586380] hover:text-[#1A1D28] hover:bg-white transition-all cursor-pointer shadow-xs border border-transparent hover:border-gray-200"
                title="Quay lại giao diện quản lý"
              >
                <span>‹</span>
                <span>Quay lại</span>
              </button>
            )}

            <div className="h-4 w-px bg-gray-300 hidden sm:block" />

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-[#1A1D28] truncate">
                {folder.name}
              </h1>
              <span className="text-xs text-[#586380] font-medium hidden sm:inline">
                {folder.language === "japanese" ? "🇯🇵 Tiếng Nhật" : "🇬🇧 Tiếng Anh"} • {activeList.length} thẻ
              </span>
            </div>
          </div>

          {/* Top-Center: Progress Counter (hiển thị rõ cả trên desktop & mobile) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-xs border border-gray-200 font-mono text-xs font-bold text-[#1A1D28]">
            <span className="text-[#4255FF]">{safeIndex + 1}</span>
            <span className="text-gray-300">/</span>
            <span>{activeList.length}</span>
          </div>

          {/* Top-Right: Settings & Controls */}
          <div className="relative flex items-center gap-1 sm:gap-2">
            {/* Nút bật/tắt chỉ học thẻ có sao */}
            <button
              type="button"
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`p-2 rounded-xl border transition-all cursor-pointer text-sm ${
                onlyStarred
                  ? "bg-[#FFCD1F]/20 text-amber-700 border-amber-300 shadow-xs"
                  : "bg-white text-[#586380] hover:text-[#1A1D28] border-gray-200"
              }`}
              title={onlyStarred ? "Đang lọc: Thẻ có sao" : "Lọc thẻ có sao"}
            >
              ⭐
            </button>

            {/* Nút phím tắt hướng dẫn */}
            <button
              type="button"
              onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
              className="p-2 rounded-xl bg-white border border-gray-200 text-[#586380] hover:text-[#1A1D28] hover:bg-gray-50 transition-all cursor-pointer text-sm hidden sm:block"
              title="Phím tắt điều khiển"
            >
              ⌨️
            </button>

            {/* Nút bánh răng cài đặt */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl bg-white border border-gray-200 text-[#586380] hover:text-[#1A1D28] hover:bg-gray-50 transition-all cursor-pointer text-sm"
              title="Cài đặt hiển thị & phát âm"
            >
              ⚙️
            </button>

            {/* Dropdown cài đặt */}
            {showSettings && (
              <div className="absolute right-0 top-12 z-40 w-72 p-4 rounded-2xl bg-white border border-gray-200 shadow-xl space-y-4 animate-fade-in text-xs">
                <div className="font-bold text-[#1A1D28] text-sm border-b border-gray-100 pb-2">
                  Tùy chọn học tập
                </div>

                {/* Tự động phát âm thanh */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#1A1D28]">Tự động phát âm</span>
                  <button
                    type="button"
                    onClick={() => setAutoAudio(!autoAudio)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      autoAudio
                        ? "bg-[#23B26D]/15 text-[#23B26D]"
                        : "bg-gray-100 text-[#586380]"
                    }`}
                  >
                    {autoAudio ? "Bật" : "Tắt"}
                  </button>
                </div>

                {/* Mặt trước hiển thị */}
                <div>
                  <span className="block font-medium text-[#1A1D28] mb-1.5">
                    Mặt trước hiển thị:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowFrontFirst("term")}
                      className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all cursor-pointer border ${
                        showFrontFirst === "term"
                          ? "bg-[#4255FF] text-white border-[#4255FF]"
                          : "bg-gray-50 text-[#586380] border-gray-200"
                      }`}
                    >
                      Thuật ngữ
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFrontFirst("def")}
                      className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all cursor-pointer border ${
                        showFrontFirst === "def"
                          ? "bg-[#4255FF] text-white border-[#4255FF]"
                          : "bg-gray-50 text-[#586380] border-gray-200"
                      }`}
                    >
                      Định nghĩa
                    </button>
                  </div>
                </div>

                {/* Tốc độ trình chiếu */}
                <div>
                  <span className="block font-medium text-[#1A1D28] mb-1.5">
                    Tốc độ trình chiếu tự động:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[2, 3, 5].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setPlaySpeed(spd)}
                        className={`py-1 rounded-lg font-semibold text-center cursor-pointer border ${
                          playSpeed === spd
                            ? "bg-[#4255FF] text-white border-[#4255FF]"
                            : "bg-gray-50 text-[#586380] border-gray-200"
                        }`}
                      >
                        {spd}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thanh tiến độ mỏng chạy ngang ở mép dưới header */}
        <div className="h-1 w-full bg-gray-200/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4255FF] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════
          KHU VỰC 2: MAIN STAGE (70% KHÔNG GIAN DỌC - TRỌNG TÂM THỊ GIÁC)
          ════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex items-center justify-center my-4 sm:my-6 select-none">
        <div
          className="w-full max-w-2xl mx-auto perspective-1000"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Tấm thẻ Flashcard với Soft Neumorphism & Material Shadow */}
          <div
            onClick={handleFlip}
            className={`relative w-full cursor-pointer transition-all duration-500 rounded-2xl sm:rounded-3xl border border-gray-200/70 p-6 sm:p-10 flex flex-col justify-between ${
              // Aspect ratio: 3:2 on desktop, 1:1 or 4:5 on mobile
              "min-h-[20rem] sm:min-h-[22rem] md:min-h-[24rem]"
            }`}
            style={{
              backgroundColor: "#FFFFFF",
              // Soft Neumorphism multi-layered shadow as specified
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 20px 25px -5px rgba(0, 0, 0, 0.03)",
            }}
          >
            {/* Top row inside card: Star Icon & Audio Icon */}
            <div className="flex items-center justify-between w-full">
              {/* Star / Bookmark Icon (Top-Left) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(currentCard.id);
                }}
                className={`p-2 rounded-xl transition-transform duration-200 hover:scale-110 cursor-pointer ${
                  isStarred
                    ? "text-[#FFCD1F]"
                    : "text-gray-300 hover:text-gray-400"
                }`}
                title={isStarred ? "Bỏ gắn sao" : "Gắn sao thẻ khó"}
              >
                <svg
                  className="w-6 h-6 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </button>

              {/* Tag phân loại mặt trước/sau */}
              <span className="text-[11px] font-semibold text-[#586380] uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100">
                {showingTerm ? "Thuật ngữ" : "Định nghĩa"}
              </span>

              {/* Audio Icon (Top-Right, cách lề chuẩn xác) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(showingTerm ? currentCard.word : currentCard.translation);
                }}
                className="p-2 rounded-xl text-[#586380] hover:text-[#4255FF] hover:bg-gray-100/80 transition-all cursor-pointer"
                title="Nghe phát âm chuẩn (R)"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              </button>
            </div>

            {/* Nội dung chữ ở trung tâm tuyệt đối của thẻ */}
            <div className="flex-1 flex flex-col items-center justify-center text-center my-6 px-4">
              {showingTerm ? (
                /* ── MẶT THUẬT NGỮ (TỪ VỰNG / KANJI) ── */
                <div className="space-y-3">
                  {/* Chữ Kanji nếu có */}
                  {currentCard.kanji && (
                    <div className="text-4xl sm:text-6xl font-black font-jp text-[#1A1D28] tracking-wide">
                      {currentCard.kanji}
                    </div>
                  )}

                  {/* Từ chính (Hiragana hoặc English) */}
                  <div
                    className={`${termFontSize} font-bold text-[#1A1D28] leading-tight`}
                  >
                    {currentCard.word}
                  </div>

                  {/* Phiên âm Romaji / IPA */}
                  {currentCard.phonetic && (
                    <div className="text-sm sm:text-base font-mono font-medium text-[#586380]">
                      /{currentCard.phonetic}/
                    </div>
                  )}

                  {/* Loại từ nếu có */}
                  {currentCard.partOfSpeech && (
                    <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-[#586380]">
                      {currentCard.partOfSpeech}
                    </span>
                  )}
                </div>
              ) : (
                /* ── MẶT ĐỊNH NGHĨA (TIẾNG VIỆT & VÍ DỤ) ── */
                <div className="space-y-4 max-w-lg">
                  {/* Nghĩa tiếng Việt */}
                  <div
                    className={`${defFontSize} font-bold text-[#4255FF] leading-snug`}
                  >
                    {currentCard.translation}
                  </div>

                  {/* Giải thích / Định nghĩa thêm */}
                  {currentCard.definition && (
                    <p className="text-xs sm:text-sm text-[#586380] leading-relaxed">
                      {currentCard.definition}
                    </p>
                  )}

                  {/* Ví dụ thực tế */}
                  {currentCard.example && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/60 text-xs sm:text-sm text-[#1A1D28] text-left leading-relaxed">
                      <span className="font-bold text-[#4255FF] block mb-0.5">
                        Ví dụ:
                      </span>
                      {currentCard.example}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hint nhỏ ở sát mép dưới thẻ */}
            <div className="flex items-center justify-between text-[11px] text-[#586380] pt-2 border-t border-gray-100/80">
              <span className="hidden sm:inline">
                Nhấp chuột hoặc bấm <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border text-gray-700 font-mono">Space</kbd> để lật
              </span>
              <span className="sm:hidden">Chạm vào thẻ để lật</span>

              <span className="text-[#586380] font-mono">
                {safeIndex + 1} / {activeList.length}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════
          KHU VỰC 3: BOTTOM CONTROL BAR (15 - 20% KHÔNG GIAN DỌC)
          ════════════════════════════════════════════════════════════ */}
      <footer
        className={`w-full pt-4 pb-2 transition-all ${
          // Mobile Sticky Bottom Bar (Thumb Zone)
          "sticky bottom-0 bg-[#F6F7FB]/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t sm:border-t-0 border-gray-200/80 z-20"
        }`}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto gap-4">
          {/* Cụm trái: Nút Play (Tự động phát slideshow) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoPlay(!autoPlay)}
              className={`p-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                autoPlay
                  ? "bg-[#23B26D] text-white border-[#23B26D] shadow-sm"
                  : "bg-white text-[#586380] hover:text-[#1A1D28] border-gray-200 shadow-xs"
              }`}
              title="Tự động lật thẻ (Slideshow)"
            >
              <span>{autoPlay ? "⏸️" : "▶️"}</span>
              <span className="hidden sm:inline">
                {autoPlay ? "Dừng" : "Phát tự động"}
              </span>
            </button>
          </div>

          {/* Cụm giữa: [< Prev] — [ 1 / 50 ] — [> Next] (Quan trọng nhất) */}
          <div className="flex items-center gap-3">
            {/* Nút Mũi tên Trái (Prev) */}
            <button
              type="button"
              onClick={handlePrev}
              className="w-11 h-11 rounded-2xl bg-white border border-gray-200 shadow-xs text-[#586380] hover:text-[#1A1D28] hover:bg-gray-50 flex items-center justify-center text-lg font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Thẻ trước (Mũi tên trái)"
            >
              ‹
            </button>

            {/* Tiến độ thẻ trung tâm */}
            <div className="text-xs font-bold font-mono text-[#1A1D28] px-3 py-2 bg-white rounded-xl border border-gray-200 shadow-xs min-w-[70px] text-center">
              {safeIndex + 1} / {activeList.length}
            </div>

            {/* Nút Mũi tên Phải (Next) - To hơn & Đậm màu hơn như đặc tả */}
            <button
              type="button"
              onClick={handleNext}
              className="w-12 h-12 rounded-2xl bg-[#4255FF] text-white shadow-md shadow-[#4255FF]/25 hover:bg-[#3344dd] flex items-center justify-center text-xl font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Thẻ kế tiếp (Mũi tên phải)"
            >
              ›
            </button>
          </div>

          {/* Cụm phải: Shuffle & Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Shuffle */}
            <button
              type="button"
              onClick={handleShuffleToggle}
              className={`p-2.5 rounded-xl border text-sm transition-all cursor-pointer ${
                isShuffled
                  ? "bg-[#4255FF] text-white border-[#4255FF] shadow-xs"
                  : "bg-white text-[#586380] hover:text-[#1A1D28] border-gray-200 shadow-xs"
              }`}
              title="Xáo trộn ngẫu nhiên thứ tự thẻ"
            >
              🔀
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-[#586380] hover:text-[#1A1D28] shadow-xs text-sm transition-all cursor-pointer hidden sm:block"
              title="Toàn màn hình (F)"
            >
              {isFullscreen ? "🗗" : "⛶"}
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Phím tắt trợ giúp */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-[#1A1D28]">
                ⌨️ Phím tắt bàn phím
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsHelp(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#586380]">Lật mặt thẻ</span>
                <kbd className="px-2 py-1 rounded bg-gray-100 font-mono font-bold">
                  Space / Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#586380]">Thẻ tiếp theo</span>
                <kbd className="px-2 py-1 rounded bg-gray-100 font-mono font-bold">
                  → / D
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#586380]">Thẻ trước đó</span>
                <kbd className="px-2 py-1 rounded bg-gray-100 font-mono font-bold">
                  ← / A
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#586380]">Nghe phát âm</span>
                <kbd className="px-2 py-1 rounded bg-gray-100 font-mono font-bold">
                  R
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#586380]">Gắn sao thẻ khó</span>
                <kbd className="px-2 py-1 rounded bg-gray-100 font-mono font-bold">
                  S
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#586380]">Toàn màn hình</span>
                <kbd className="px-2 py-1 rounded bg-gray-100 font-mono font-bold">
                  F
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
