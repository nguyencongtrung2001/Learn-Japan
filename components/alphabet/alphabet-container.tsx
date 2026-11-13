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
    <div className="h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] overflow-hidden px-4 sm:px-6 py-4">
      <div className="h-full max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-5 items-stretch overflow-hidden">
        {/* ══════════ CỘT BÊN TRÁI: BANNER, TIẾN ĐỘ & MENU TABS ══════════ */}
        <aside className="w-full lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col justify-between overflow-y-auto rounded-2xl border border-[#E2E4E9] bg-white p-5 shadow-xs space-y-4">
          <div className="space-y-4">
            {/* Header Title */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-[#4255FF] mb-2">
                <span>🇯🇵 Bảng Chữ Cái Tiếng Nhật</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1D28]">
                Bảng Chữ Cái <span className="text-[#4255FF]">Hiragana & Katakana</span>
              </h1>
              <p className="text-xs text-[#586380] mt-1.5 leading-relaxed">
                Trọn bộ 208 ký tự tiếng Nhật: Hiragana, Katakana, Âm đục, Âm bán đục, Âm ghép, Âm ngắt và Trường âm.
              </p>
            </div>

            {/* Hộp tiến độ */}
            <div className="bg-[#F6F7FB] p-4 rounded-xl border border-[#E2E4E9] space-y-3">
              <div className="flex items-center gap-3.5">
                {/* Vòng tròn tiến độ */}
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
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

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#1A1D28]">
                    Đã thuộc: <span className="text-[#23B26D] font-mono text-sm">{totalMemorized}</span> / {totalKanaCount} chữ
                  </div>
                  <div className="text-[11px] text-[#586380] grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 font-medium">
                    <span>Hira: {hiraMemorized}/{hiragana.length}</span>
                    <span>Kata: {kataMemorized}/{katakana.length}</span>
                    <span>Đục: {dakuMemorized}/{dakuten.length}</span>
                    <span>Ghép: {youonMemorized}/{youon.length}</span>
                  </div>
                </div>
              </div>

              {totalMemorized > 0 && (
                <div className="pt-2 border-t border-[#E2E4E9] flex justify-end">
                  <button
                    type="button"
                    onClick={resetAllMemorized}
                    className="text-[11px] text-red-500 hover:underline cursor-pointer"
                  >
                    ✕ Đặt lại tiến độ
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ══════════ TABS ĐIỀU HƯỚNG DỌC BÊN TRÁI ══════════ */}
          <div className="space-y-2 pt-2 border-t border-[#E2E4E9]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#939BB4] px-1">
              Chế độ học tập
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("flashcard")}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-between ${
                activeTab === "flashcard"
                  ? "bg-[#4255FF] text-white shadow-xs"
                  : "border border-[#E2E4E9] bg-white text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🎴</span>
                <span>Lật Thẻ Flashcard</span>
              </span>
              <span className="text-xs opacity-75">➔</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("chart")}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-between ${
                activeTab === "chart"
                  ? "bg-[#4255FF] text-white shadow-xs"
                  : "border border-[#E2E4E9] bg-white text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📊</span>
                <span>Bảng 50 Âm (Chart)</span>
              </span>
              <span className="text-xs opacity-75">➔</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("quiz")}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-between ${
                activeTab === "quiz"
                  ? "bg-[#4255FF] text-white shadow-xs"
                  : "border border-[#E2E4E9] bg-white text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>⚡</span>
                <span>Luyện Phản Xạ (Quiz)</span>
              </span>
              <span className="text-xs opacity-75">➔</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("rules")}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-between ${
                activeTab === "rules"
                  ? "bg-[#4255FF] text-white shadow-xs"
                  : "border border-[#E2E4E9] bg-white text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📖</span>
                <span>Cẩm Nang Âm Đặc Biệt</span>
              </span>
              <span className="text-xs opacity-75">➔</span>
            </button>
          </div>
        </aside>

        {/* ══════════ CỘT BÊN PHẢI: CHIẾU THẺ FLASHCARD / NỘI DUNG (KHÔNG SCROLL TRANG) ══════════ */}
        <main className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
          <div className="h-full overflow-y-auto pr-1">
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
        </main>
      </div>
    </div>
  );
}
