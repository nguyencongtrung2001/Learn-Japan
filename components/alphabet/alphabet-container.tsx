"use client";

import { useState } from "react";
import { KanaFlashcard } from "./kana-flashcard";
import { KanaChart } from "./kana-chart";
import { KanaQuiz } from "./kana-quiz";
import { KanaRules } from "./kana-rules";
import { useKanaStorage } from "@/hooks/use-kana-storage";
import { hiragana, katakana, dakuten, youon, allKana } from "@/data/kana-data";

type TabType = "flashcard" | "chart" | "quiz" | "rules";

export function AlphabetContainer() {
  const [activeTab, setActiveTab] = useState<TabType>("flashcard");
  const { isMemorized, toggleMemorized, memorizedIds, resetAllMemorized } = useKanaStorage();

  // Progress metrics
  const totalMemorized = memorizedIds.size;
  const totalKanaCount = allKana.length;
  const overallPercent = Math.round((totalMemorized / totalKanaCount) * 100);

  const hiraMemorized = hiragana.filter((i) => isMemorized(i.id)).length;
  const kataMemorized = katakana.filter((i) => isMemorized(i.id)).length;
  const dakuMemorized = dakuten.filter((i) => isMemorized(i.id)).length;
  const youonMemorized = youon.filter((i) => isMemorized(i.id)).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* ══════════ HERO BANNER & TIẾN ĐỘ TỔNG QUAN ══════════ */}
      <div className="glass-card relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border/80 shadow-2xl space-y-5">
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-sakura via-indigo to-emerald" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Tiêu đề & Giới thiệu */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sakura/15 border border-sakura/30 text-sakura-light mb-2">
              <span>🇯🇵 Bảng Chữ Cái Tiếng Nhật</span>
              <span>•</span>
              <span>Kana Mastery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
              Bảng Chữ Cái <span className="gradient-text">Hiragana & Katakana</span>
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 max-w-2xl leading-relaxed">
              Trọn bộ 208 ký tự tiếng Nhật: Hiragana mềm mại, Katakana hiện đại, Âm đục (Dakuten), Âm bán đục (Handakuten), Âm ghép (Youon), Âm ngắt và Trường âm.
            </p>
          </div>

          {/* Hộp tiến độ tổng thể */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface/80 p-4 rounded-2xl border border-border/70 shrink-0">
            {/* Vòng tròn phần trăm */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-500 ease-out"
                  strokeDasharray={`${overallPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-mono font-black text-foreground">
                {overallPercent}%
              </span>
            </div>

            <div className="text-center sm:text-left">
              <div className="text-xs font-bold text-foreground">
                Đã thuộc: <span className="text-emerald-400 font-mono text-sm">{totalMemorized}</span> / {totalKanaCount} chữ
              </div>
              <div className="text-[11px] text-foreground-dim flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span>Hira: {hiraMemorized}/{hiragana.length}</span>
                <span>•</span>
                <span>Kata: {kataMemorized}/{katakana.length}</span>
                <span>•</span>
                <span>Đục: {dakuMemorized}/{dakuten.length}</span>
                <span>•</span>
                <span>Ghép: {youonMemorized}/{youon.length}</span>
              </div>
              {totalMemorized > 0 && (
                <button
                  type="button"
                  onClick={resetAllMemorized}
                  className="text-[10px] text-foreground-dim hover:text-rose transition-colors cursor-pointer mt-1"
                >
                  ✕ Đặt lại tiến độ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ TABS CHÍNH ══════════ */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab("flashcard")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "flashcard"
                ? "bg-gradient-to-r from-sakura to-indigo text-white shadow-lg shadow-indigo/25 scale-[1.02]"
                : "border border-border/60 bg-surface/70 text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <span>🎴</span> Lật Thẻ Flashcard
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chart")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "chart"
                ? "bg-gradient-to-r from-teal-500 to-emerald text-white shadow-lg shadow-emerald/25 scale-[1.02]"
                : "border border-border/60 bg-surface/70 text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <span>📊</span> Bảng 50 Âm (Chart)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "quiz"
                ? "bg-gradient-to-r from-indigo to-purple-600 text-white shadow-lg shadow-purple/25 scale-[1.02]"
                : "border border-border/60 bg-surface/70 text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <span>⚡</span> Luyện Phản Xạ (Quiz)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "rules"
                ? "bg-gradient-to-r from-amber-500 to-rose text-white shadow-lg shadow-amber-500/25 scale-[1.02]"
                : "border border-border/60 bg-surface/70 text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <span>📖</span> Cẩm Nang Âm Đặc Biệt
          </button>
        </div>
      </div>

      {/* ══════════ NỘI DUNG TỪNG TAB ══════════ */}
      <div>
        {activeTab === "flashcard" && (
          <KanaFlashcard
            isMemorized={isMemorized}
            toggleMemorized={toggleMemorized}
          />
        )}

        {activeTab === "chart" && (
          <KanaChart
            isMemorized={isMemorized}
            toggleMemorized={toggleMemorized}
          />
        )}

        {activeTab === "quiz" && <KanaQuiz />}

        {activeTab === "rules" && <KanaRules />}
      </div>
    </div>
  );
}
