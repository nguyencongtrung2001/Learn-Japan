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
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl border border-[#E2E4E9] bg-white shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Tiêu đề & Giới thiệu */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-[#4255FF] mb-2">
              <span>🇯🇵 Bảng Chữ Cái Tiếng Nhật</span>
              <span>•</span>
              <span>Kana Mastery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#1A1D28]">
              Bảng Chữ Cái <span className="text-[#4255FF]">Hiragana & Katakana</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#586380] mt-1 max-w-2xl leading-relaxed">
              Trọn bộ 208 ký tự tiếng Nhật: Hiragana mềm mại, Katakana hiện đại, Âm đục (Dakuten), Âm bán đục (Handakuten), Âm ghép (Youon), Âm ngắt và Trường âm.
            </p>
          </div>

          {/* Hộp tiến độ tổng thể */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#F6F7FB] p-4 rounded-xl border border-[#E2E4E9] shrink-0">
            {/* Vòng tròn phần trăm */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#E2E4E9]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#23B26D] transition-all duration-500 ease-out"
                  strokeDasharray={`${overallPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-mono font-black text-[#1A1D28]">
                {overallPercent}%
              </span>
            </div>

            <div className="text-center sm:text-left">
              <div className="text-xs font-bold text-[#1A1D28]">
                Đã thuộc: <span className="text-[#23B26D] font-mono text-sm">{totalMemorized}</span> / {totalKanaCount} chữ
              </div>
              <div className="text-[11px] text-[#586380] flex items-center gap-1.5 mt-0.5 flex-wrap">
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
                  className="text-[10px] text-red-500 hover:underline cursor-pointer mt-1"
                >
                  ✕ Đặt lại tiến độ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ TABS CHÍNH ══════════ */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E2E4E9]">
          <button
            type="button"
            onClick={() => setActiveTab("flashcard")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "flashcard"
                ? "bg-[#4255FF] text-white shadow-xs"
                : "border border-[#E2E4E9] bg-white text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
            }`}
          >
            <span>🎴</span> Lật Thẻ Flashcard
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chart")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "chart"
                ? "bg-[#4255FF] text-white shadow-xs"
                : "border border-[#E2E4E9] bg-white text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
            }`}
          >
            <span>📊</span> Bảng 50 Âm (Chart)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "quiz"
                ? "bg-[#4255FF] text-white shadow-xs"
                : "border border-[#E2E4E9] bg-white text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
            }`}
          >
            <span>⚡</span> Luyện Phản Xạ (Quiz)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "rules"
                ? "bg-[#4255FF] text-white shadow-xs"
                : "border border-[#E2E4E9] bg-white text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
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
