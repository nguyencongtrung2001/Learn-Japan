"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useAudio } from "@/hooks/use-audio";
import { calculateStudyStreak } from "@/lib/streak";

interface InteractiveHeroCardProps {
  initialRetentionRate?: number;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("studyStreak_global");
}

function getServerSnapshot(): string | null {
  return null;
}

export function InteractiveHeroCard({ initialRetentionRate = 0 }: InteractiveHeroCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const playAudio = useAudio("en-US");

  const streakRaw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const streak = useMemo(() => {
    if (!streakRaw) return 0;
    try {
      const dates = JSON.parse(streakRaw);
      if (Array.isArray(dates)) {
        return calculateStudyStreak(dates).displayCount;
      }
    } catch {
      // ignore
    }
    return 0;
  }, [streakRaw]);

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    playAudio("Perseverance");
  };

  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md perspective-1000 select-none">
      {/* Floating mini badge: Streak */}
      <div className="animate-float absolute -top-4 -left-3 sm:-left-6 z-20 flex items-center gap-2 rounded-2xl border border-[#E2E4E9] bg-white px-3.5 py-1.5 shadow-lg">
        <span className="text-base sm:text-lg">🔥</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#939BB4]">Chuỗi ngày</p>
          <p className="text-xs font-black text-[#FFCD1F]">
            {streak} ngày liên tục
          </p>
        </div>
      </div>

      {/* Floating mini badge: Mastery */}
      <div
        className="animate-float absolute -bottom-3 -right-3 sm:-right-4 z-20 flex items-center gap-2 rounded-2xl border border-[#E2E4E9] bg-white px-3.5 py-1.5 shadow-lg"
        style={{ animationDelay: "1.5s" }}
      >
        <span className="text-base sm:text-lg">🌱</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#939BB4]">Tiến độ</p>
          <p className="text-xs font-black text-[#23B26D]">
            Đã nhớ {initialRetentionRate}%
          </p>
        </div>
      </div>

      {/* The 3D Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="group cursor-pointer h-72 sm:h-80 w-full transition-transform duration-300 hover:scale-[1.02]"
        title="Bấm để lật thẻ"
      >
        <div
          className={`flip-card-inner h-full w-full rounded-3xl transition-transform duration-700 [transform-style:preserve-3d] ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* ═══════ CARD FRONT ═══════ */}
          <div className="glass-card absolute inset-0 flex flex-col justify-between overflow-hidden p-6 sm:p-7 [backface-visibility:hidden]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#4255FF] opacity-80 rounded-t-2xl" />

            {/* Header of front */}
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-[#4255FF]/20 bg-[#4255FF]/8 px-3 py-1 text-xs font-bold text-[#4255FF]">
                🇬🇧 English • Oxford 3000 • C1
              </span>
              <button
                type="button"
                onClick={handleAudio}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E4E9] bg-white text-base shadow-sm hover:bg-[#EDEFF4] hover:scale-110 active:scale-95 transition-all"
                title="Nghe phát âm"
                aria-label="Nghe phát âm"
              >
                🔊
              </button>
            </div>

            {/* Core word & IPA */}
            <div className="text-center my-auto py-2">
              <h2 className="text-3xl sm:text-4xl font-black text-[#1A1D28] tracking-tight mb-1.5">
                Perseverance
              </h2>
              <span className="inline-block rounded-full bg-[#4255FF]/8 px-3 py-0.5 text-xs sm:text-sm font-semibold tracking-wide text-[#4255FF]">
                /ˌpɜː.sɪˈvɪə.rəns/
              </span>
            </div>

            {/* Bottom prompt */}
            <div className="flex items-center justify-between border-t border-[#E2E4E9] pt-3 text-xs text-[#939BB4]">
              <span className="flex items-center gap-1 font-medium text-[#586380]">
                🔄 Bấm để lật xem nghĩa
              </span>
              <span className="font-bold text-[#4255FF]">Cấp độ 5 ⚡</span>
            </div>
          </div>

          {/* ═══════ CARD BACK ═══════ */}
          <div className="glass-card absolute inset-0 flex flex-col justify-between overflow-hidden p-6 sm:p-7 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#23B26D] opacity-80 rounded-t-2xl" />

            <div className="flex items-center justify-between">
              <span className="rounded-full border border-[#23B26D]/20 bg-[#23B26D]/8 px-3 py-1 text-xs font-bold text-[#23B26D]">
                ✅ Nghĩa tiếng Việt
              </span>
              <span className="text-xs text-[#939BB4] font-medium">Bấm để lật lại ↩</span>
            </div>

            <div className="my-auto text-left py-2 space-y-2.5">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#1A1D28]">
                  Sự kiên trì, bền bỉ
                </h3>
                <p className="text-xs sm:text-sm font-medium text-[#586380] mt-0.5">
                  Quyết tâm theo đuổi mục tiêu dù gặp nhiều trở ngại
                </p>
              </div>

              <div className="rounded-xl border border-[#E2E4E9] bg-[#F6F7FB] p-2.5 sm:p-3 text-xs leading-relaxed text-[#586380]">
                <p className="italic text-[#939BB4]">
                  &ldquo;Through hard work and perseverance, you can achieve any goal in life.&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#E2E4E9] pt-3 text-xs">
              <span className="font-semibold text-[#23B26D]">🌱 Đã thuộc vững</span>
              <span className="text-[#939BB4]">Ôn lại sau 24 ngày</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
