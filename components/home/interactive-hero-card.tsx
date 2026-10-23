"use client";

import { useState } from "react";
import { useAudio } from "@/hooks/use-audio";

export function InteractiveHeroCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const playAudio = useAudio("en-US");

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    playAudio("Perseverance");
  };

  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md perspective-1000 select-none">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-r from-sakura/20 via-indigo/20 to-emerald/20 blur-2xl opacity-60 animate-pulse-glow" />

      {/* Floating mini badge: Streak */}
      <div className="animate-float absolute -top-4 -left-3 sm:-left-6 z-20 flex items-center gap-2 rounded-2xl border border-border/80 bg-surface/90 px-3.5 py-1.5 shadow-xl backdrop-blur-md">
        <span className="text-base sm:text-lg">🔥</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-dim">Chuỗi ngày</p>
          <p className="text-xs font-black text-gold">12 ngày liên tục</p>
        </div>
      </div>

      {/* Floating mini badge: Mastery */}
      <div className="animate-float absolute -bottom-3 -right-3 sm:-right-4 z-20 flex items-center gap-2 rounded-2xl border border-border/80 bg-surface/90 px-3.5 py-1.5 shadow-xl backdrop-blur-md" style={{ animationDelay: "1.5s" }}>
        <span className="text-base sm:text-lg">🌱</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-dim">Tiến độ</p>
          <p className="text-xs font-black text-emerald">Đã nhớ 92%</p>
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
          <div className="glass-card absolute inset-0 flex flex-col justify-between overflow-hidden p-6 sm:p-7 shadow-2xl [backface-visibility:hidden]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sakura via-indigo to-emerald opacity-75" />
            
            {/* Header of front */}
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-indigo/30 bg-indigo/10 px-3 py-1 text-xs font-bold text-indigo-light">
                🇬🇧 English • Oxford 3000 • C1
              </span>
              <button
                type="button"
                onClick={handleAudio}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-base shadow-sm hover:border-indigo/40 hover:bg-surface-hover hover:scale-110 active:scale-95 transition-all"
                title="Nghe phát âm"
                aria-label="Nghe phát âm"
              >
                🔊
              </button>
            </div>

            {/* Core word & IPA */}
            <div className="text-center my-auto py-2">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-1.5">
                Perseverance
              </h2>
              <span className="inline-block rounded-full bg-indigo/10 px-3 py-0.5 text-xs sm:text-sm font-semibold tracking-wide text-indigo-light">
                /ˌpɜː.sɪˈvɪə.rəns/
              </span>
            </div>

            {/* Bottom prompt */}
            <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-foreground-dim">
              <span className="flex items-center gap-1 font-medium text-foreground-muted">
                <span>🔄</span> Bấm để lật xem nghĩa
              </span>
              <span className="font-bold text-sakura">Cấp độ 6 🌸</span>
            </div>
          </div>

          {/* ═══════ CARD BACK ═══════ */}
          <div className="glass-card absolute inset-0 flex flex-col justify-between overflow-hidden p-6 sm:p-7 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] border-indigo/40 bg-surface/95">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald via-indigo to-sakura opacity-75" />

            <div className="flex items-center justify-between">
              <span className="rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald">
                ✅ Nghĩa tiếng Việt
              </span>
              <span className="text-xs text-foreground-dim font-medium">Bấm để lật lại ↩</span>
            </div>

            <div className="my-auto text-left py-2 space-y-2.5">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  Sự kiên trì, bền bỉ
                </h3>
                <p className="text-xs sm:text-sm font-medium text-foreground-muted mt-0.5">
                  Quyết tâm theo đuổi mục tiêu dù gặp nhiều trở ngại
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-background/50 p-2.5 sm:p-3 text-xs leading-relaxed text-foreground-muted">
                <p className="italic text-foreground-dim">
                  &ldquo;Through hard work and perseverance, you can achieve any goal in life.&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
              <span className="font-semibold text-emerald">🌱 Đã thuộc vững</span>
              <span className="text-foreground-dim">Ôn lại sau 24 ngày</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
