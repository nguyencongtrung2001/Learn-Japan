"use client";

import { useState } from "react";
import {
  GOJUON_ROWS,
  DAKUTEN_ROWS,
  YOUON_ROWS,
  findKanaItem,
  type KanaItem,
} from "@/data/kana-data";
import { playKanaAudio } from "@/lib/kana-audio";

interface KanaChartProps {
  isMemorized: (id: string) => boolean;
  toggleMemorized: (id: string) => void;
}

export function KanaChart({ isMemorized, toggleMemorized }: KanaChartProps) {
  const [chartMode, setChartMode] = useState<"hiragana" | "katakana" | "dakuten" | "youon">("hiragana");
  const [showRomaji, setShowRomaji] = useState(true);
  const [activeItem, setActiveItem] = useState<KanaItem | null>(null);

  // Play audio on cell click
  const handleCellClick = (kanaChar: string) => {
    if (!kanaChar) return;
    playKanaAudio(kanaChar);
    const item = findKanaItem(kanaChar);
    if (item) {
      setActiveItem(item);
    }
  };

  return (
    <div className="space-y-6">
      {/* ══════════ THANH ĐIỀU HƯỚNG BẢNG ══════════ */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Nhóm bảng */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface/80 border border-border/60">
          <button
            type="button"
            onClick={() => setChartMode("hiragana")}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              chartMode === "hiragana"
                ? "bg-sakura text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            🌸 Hiragana (46)
          </button>
          <button
            type="button"
            onClick={() => setChartMode("katakana")}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              chartMode === "katakana"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            ⚡ Katakana (46)
          </button>
          <button
            type="button"
            onClick={() => setChartMode("dakuten")}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              chartMode === "dakuten"
                ? "bg-emerald text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            🔔 Âm Đục & Bán Đục
          </button>
          <button
            type="button"
            onClick={() => setChartMode("youon")}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              chartMode === "youon"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            🧩 Âm Ghép (Youon)
          </button>
        </div>

        {/* Nút bật tắt Romaji & Hướng dẫn */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRomaji(!showRomaji)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              showRomaji
                ? "border-indigo/40 bg-indigo/15 text-indigo-light"
                : "border-border/60 bg-surface/60 text-foreground-muted hover:text-foreground"
            }`}
            title="Bật/Tắt hiển thị phiên âm Romaji để tự kiểm tra trí nhớ"
          >
            <span>{showRomaji ? "👁️ Hiện Romaji" : "🙈 Đang ẩn Romaji"}</span>
          </button>

          <span className="text-[11px] text-foreground-dim hidden sm:inline">
            (Bấm vào ô để nghe phát âm & xem chi tiết)
          </span>
        </div>
      </div>

      {/* ══════════ HIỂN THỊ BẢNG GOJUON 5x10 / DAKUTEN / YOUON ══════════ */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-border/80 shadow-xl overflow-x-auto">
        {/* TH1 & TH2: HIRAGANA & KATAKANA CƠ BẢN (5x10) */}
        {(chartMode === "hiragana" || chartMode === "katakana") && (
          <div className="min-w-[580px]">
            {/* Header cột nguyên âm: a, i, u, e, o */}
            <div className="grid grid-cols-6 gap-2 mb-2 pb-2 border-b border-border/50 text-center font-mono font-bold text-xs uppercase text-foreground-muted">
              <div className="text-left pl-2 font-sans font-bold">Hàng / Âm</div>
              <div>Cột A (a)</div>
              <div>Cột I (i)</div>
              <div>Cột U (u)</div>
              <div>Cột E (e)</div>
              <div>Cột O (o)</div>
            </div>

            {/* Các hàng chữ cái */}
            <div className="space-y-2">
              {GOJUON_ROWS.map((row) => {
                const chars = chartMode === "hiragana" ? row.charsHira : row.charsKata;
                return (
                  <div key={row.id} className="grid grid-cols-6 gap-2 items-center">
                    {/* Tên hàng */}
                    <div className="text-xs font-bold text-foreground-muted truncate pl-2">
                      {row.name}
                    </div>

                    {/* 5 ô âm (a, i, u, e, o) */}
                    {chars.slice(0, 5).map((char, colIdx) => {
                      if (!char) {
                        return (
                          <div
                            key={colIdx}
                            className="h-16 rounded-2xl bg-surface/20 border border-dashed border-border/40 flex items-center justify-center opacity-30 select-none"
                          >
                            <span className="text-xs text-foreground-dim">—</span>
                          </div>
                        );
                      }

                      const item = findKanaItem(char);
                      const memorized = item ? isMemorized(item.id) : false;

                      return (
                        <button
                          key={colIdx}
                          type="button"
                          onClick={() => handleCellClick(char)}
                          className={`group relative h-16 rounded-2xl border transition-all duration-200 p-1 flex flex-col items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-xs ${
                            memorized
                              ? "bg-emerald/10 border-emerald/50 hover:bg-emerald/20 hover:border-emerald"
                              : "bg-surface/70 border-border/70 hover:bg-surface-hover hover:border-indigo/50"
                          }`}
                        >
                          {/* Dấu sao đã thuộc */}
                          {memorized && (
                            <span className="absolute top-1 right-1.5 text-[10px] text-emerald-400">
                              ✨
                            </span>
                          )}

                          <span className="kana-display text-2xl sm:text-3xl font-bold text-foreground group-hover:text-indigo-light transition-colors">
                            {char}
                          </span>

                          {showRomaji && (
                            <span className="text-[11px] font-mono font-semibold text-foreground-dim group-hover:text-foreground">
                              {row.romaji[colIdx]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Hàng đặc biệt: Âm ん / ン */}
              <div className="grid grid-cols-6 gap-2 items-center pt-2 border-t border-border/40">
                <div className="text-xs font-bold text-foreground-muted pl-2">
                  Âm mũi N (ん)
                </div>
                {(() => {
                  const nChar = chartMode === "hiragana" ? "ん" : "ン";
                  const nItem = findKanaItem(nChar);
                  const memorized = nItem ? isMemorized(nItem.id) : false;
                  return (
                    <button
                      type="button"
                      onClick={() => handleCellClick(nChar)}
                      className={`group relative h-16 rounded-2xl border transition-all duration-200 p-1 flex flex-col items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-xs ${
                        memorized
                          ? "bg-emerald/10 border-emerald/50 hover:bg-emerald/20 hover:border-emerald"
                          : "bg-surface/70 border-border/70 hover:bg-surface-hover hover:border-indigo/50"
                      }`}
                    >
                      {memorized && (
                        <span className="absolute top-1 right-1.5 text-[10px] text-emerald-400">
                          ✨
                        </span>
                      )}
                      <span className="kana-display text-2xl sm:text-3xl font-bold text-foreground group-hover:text-indigo-light">
                        {nChar}
                      </span>
                      {showRomaji && (
                        <span className="text-[11px] font-mono font-semibold text-foreground-dim">
                          n
                        </span>
                      )}
                    </button>
                  );
                })()}
                <div className="col-span-4 pl-3 text-xs text-foreground-dim flex items-center">
                  💡 Ký tự duy nhất đứng một mình biểu thị 1 nhịp phát âm độc lập
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TH3: ÂM ĐỤC (DAKUTEN) & BÁN ĐỤC (HANDAKUTEN) */}
        {chartMode === "dakuten" && (
          <div className="min-w-[580px] space-y-4">
            <div className="text-xs text-foreground-muted flex items-center justify-between">
              <span>
                Âm đục (Dấu nháy ゛) và Bán đục (Dấu tròn ゜) cho cả Hiragana & Katakana:
              </span>
            </div>

            {/* Bảng Dakuten */}
            <div className="space-y-3">
              {DAKUTEN_ROWS.map((row) => (
                <div key={row.id} className="grid grid-cols-6 gap-2 items-center">
                  <div className="text-xs font-bold text-foreground-muted pl-2">
                    {row.name}
                  </div>
                  {row.charsHira.map((char, colIdx) => {
                    const kataChar = row.charsKata[colIdx];
                    const itemHira = findKanaItem(char);
                    const memorized = itemHira ? isMemorized(itemHira.id) : false;

                    return (
                      <button
                        key={colIdx}
                        type="button"
                        onClick={() => handleCellClick(char)}
                        className={`group relative h-16 rounded-2xl border transition-all duration-200 p-1 flex flex-col items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-xs ${
                          memorized
                            ? "bg-emerald/10 border-emerald/50 hover:bg-emerald/20 hover:border-emerald"
                            : "bg-surface/70 border-border/70 hover:bg-surface-hover hover:border-indigo/50"
                        }`}
                      >
                        {memorized && (
                          <span className="absolute top-1 right-1.5 text-[10px] text-emerald-400">
                            ✨
                          </span>
                        )}
                        <div className="flex items-baseline gap-1.5">
                          <span className="kana-display text-2xl font-bold text-foreground group-hover:text-sakura-light">
                            {char}
                          </span>
                          <span className="kana-display text-base font-bold text-teal-400 opacity-80">
                            {kataChar}
                          </span>
                        </div>
                        {showRomaji && (
                          <span className="text-[11px] font-mono font-semibold text-foreground-dim">
                            {row.romaji[colIdx]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TH4: ÂM GHÉP (YOUON) */}
        {chartMode === "youon" && (
          <div className="min-w-[580px] space-y-4">
            <div className="text-xs text-foreground-muted">
              Âm ghép kết hợp chữ hàng i với chữ nhỏ ゃ/ゅ/ょ (Hiragana) hoặc ャ/ュ/ョ (Katakana):
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {YOUON_ROWS.map((row) => (
                <div
                  key={row.id}
                  className="p-3 rounded-2xl bg-surface/50 border border-border/60 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-bold text-foreground-muted w-24">
                    {row.name}:
                  </span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {row.charsHira.map((char, idx) => {
                      const kataChar = row.charsKata[idx];
                      const item = findKanaItem(char);
                      const memorized = item ? isMemorized(item.id) : false;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleCellClick(char)}
                          className={`group px-3 py-1.5 rounded-xl border flex flex-col items-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                            memorized
                              ? "bg-emerald/15 border-emerald/50 text-emerald-400"
                              : "bg-surface border-border hover:border-indigo/50 text-foreground"
                          }`}
                        >
                          <div className="flex items-baseline gap-1">
                            <span className="kana-display text-lg font-bold">
                              {char}
                            </span>
                            <span className="kana-display text-xs text-teal-400 opacity-80">
                              {kataChar}
                            </span>
                          </div>
                          {showRomaji && (
                            <span className="text-[10px] font-mono text-foreground-dim group-hover:text-foreground">
                              {row.romaji[idx]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════ MODAL CHI TIẾT CHỮ CÁI KHI CLICK ══════════ */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="glass-card w-full max-w-sm p-6 rounded-3xl border-2 border-indigo/40 shadow-2xl relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-sakura via-indigo to-emerald" />

            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-foreground-muted hover:text-foreground cursor-pointer"
            >
              ✕
            </button>

            {/* Tiêu đề & Thông tin */}
            <div className="text-center space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface border border-border text-foreground-muted">
                {activeItem.type === "hiragana" ? "🌸 Hiragana" : "⚡ Katakana"} •{" "}
                Hàng {activeItem.row.toUpperCase()}
              </div>

              {/* Ký tự lớn */}
              <div className="kana-display text-7xl font-black text-foreground drop-shadow-md">
                {activeItem.kana}
              </div>

              {/* Romaji & Phiên âm tiếng Việt */}
              <div>
                <span className="text-2xl font-black font-mono text-indigo-light">
                  /{activeItem.romaji}/
                </span>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Phát âm tiếng Việt: <strong>{activeItem.vietnamese}</strong>
                </p>
              </div>

              {/* Nút nghe âm thanh */}
              <button
                type="button"
                onClick={() => playKanaAudio(activeItem.kana)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo text-white font-bold text-xs sm:text-sm hover:bg-indigo-dark transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>🔊</span> Nghe phát âm chuẩn
              </button>

              {/* Hộp từ vựng ví dụ */}
              <div className="rounded-2xl bg-surface/90 border border-border p-3.5 text-left space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-foreground-dim uppercase">
                  <span>Từ vựng ví dụ</span>
                  <button
                    type="button"
                    onClick={() => playKanaAudio(activeItem.example.word)}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    🔊 Nghe
                  </button>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xl font-bold kana-display text-foreground">
                    {activeItem.example.word}
                  </span>
                  {activeItem.example.kanji && (
                    <span className="text-xs font-bold text-sakura-light">
                      ({activeItem.example.kanji})
                    </span>
                  )}
                  <span className="text-xs font-mono text-indigo-light">
                    [{activeItem.example.romaji}]
                  </span>
                </div>
                <p className="text-xs font-medium text-emerald-400">
                  ➔ {activeItem.example.meaning}
                </p>
              </div>

              {/* Nút đánh dấu đã thuộc */}
              <button
                type="button"
                onClick={() => toggleMemorized(activeItem.id)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isMemorized(activeItem.id)
                    ? "bg-emerald/20 text-emerald-400 border border-emerald/40"
                    : "bg-surface hover:bg-surface-hover border border-border text-foreground-muted hover:text-foreground"
                }`}
              >
                <span>{isMemorized(activeItem.id) ? "✨ Đã thuộc chữ này" : "☆ Đánh dấu đã thuộc"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
