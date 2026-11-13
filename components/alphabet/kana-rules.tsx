"use client";

import { useState } from "react";
import {
  sokuonRules,
  chouonRules,
  hatsuonRules,
  confusingKanaPairs,
} from "@/data/kana-data";
import { playKanaAudio } from "@/lib/kana-audio";

export function KanaRules() {
  const [activeSection, setActiveSection] = useState<
    "sokuon" | "chouon" | "hatsuon" | "confusing"
  >("sokuon");

  return (
    <div className="space-y-6">
      {/* ══════════ TABS ĐIỀU HƯỚNG QUY TẮC ══════════ */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSection("sokuon")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === "sokuon"
                ? "bg-gradient-to-r from-sakura to-rose text-white shadow-md"
                : "border border-border/60 bg-surface/60 text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <span>⏸️</span> Âm Ngắt (っ / ッ)
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("chouon")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === "chouon"
                ? "bg-gradient-to-r from-indigo to-teal-500 text-white shadow-md"
                : "border border-border/60 bg-surface/60 text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <span>〰️</span> Trường Âm (Chōon)
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("hatsuon")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === "hatsuon"
                ? "bg-gradient-to-r from-emerald to-teal-600 text-white shadow-md"
                : "border border-border/60 bg-surface/60 text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <span>👃</span> Âm Mũi (ん / ン)
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("confusing")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === "confusing"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                : "border border-border/60 bg-surface/60 text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <span>🔍</span> Chữ Dễ Nhầm Lẫn
          </button>
        </div>
      </div>

      {/* ══════════ NỘI DUNG 1: ÂM NGẮT (SOKUON) ══════════ */}
      {activeSection === "sokuon" && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-border/80 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-border/60 pb-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-sakura-light bg-sakura/15 px-3 py-1 rounded-full mb-2">
              <span>促音 • Sokuon</span>
            </div>
            <h3 className="text-2xl font-black text-foreground">
              {sokuonRules.title}
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 leading-relaxed">
              {sokuonRules.description}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo/10 border border-indigo/25 text-xs sm:text-sm leading-relaxed text-indigo-light space-y-1.5">
            <strong className="block text-foreground font-bold">Quy tắc phát âm & Romaji:</strong>
            <p>{sokuonRules.rule}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-dim">
              Ví dụ thực tế (Bấm để nghe phát âm):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sokuonRules.examples.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => playKanaAudio(ex.audio)}
                  className="p-4 rounded-2xl bg-surface/80 border border-border/70 hover:border-indigo/50 hover:bg-surface-hover transition-all text-left group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="kana-display text-2xl font-black text-foreground group-hover:text-indigo-light">
                      {ex.kana}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      🔊 Nghe
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-light">
                    /{ex.romaji}/
                  </div>
                  <div className="text-xs text-foreground-muted mt-1">
                    {ex.meaning}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ NỘI DUNG 2: TRƯỜNG ÂM (CHOUON) ══════════ */}
      {activeSection === "chouon" && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-border/80 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-border/60 pb-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-light bg-indigo/15 px-3 py-1 rounded-full mb-2">
              <span>長音 • Chōon</span>
            </div>
            <h3 className="text-2xl font-black text-foreground">
              {chouonRules.title}
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 leading-relaxed">
              {chouonRules.description}
            </p>
          </div>

          {/* Trường âm Hiragana */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>🌸</span> 1. Quy tắc trường âm trong Hiragana (5 Cột nguyên âm):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chouonRules.hiraganaRules.map((r, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-surface/70 border border-border/70 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">
                      {r.row}
                    </span>
                    <span className="text-xs font-bold text-sakura-light bg-sakura/15 px-2.5 py-0.5 rounded-full border border-sakura/30">
                      {r.extension}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-dim">{r.explanation}</p>
                  <div className="space-y-1 pt-1 border-t border-border/40">
                    {r.examples.map((ex, eIdx) => (
                      <div
                        key={eIdx}
                        onClick={() => playKanaAudio(ex.kana)}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                      >
                        <span className="font-bold kana-display text-foreground">
                          {ex.kana}{" "}
                          <span className="font-mono font-normal text-indigo-light">
                            [{ex.romaji}]
                          </span>
                        </span>
                        <span className="text-emerald-400 text-[11px]">
                          {ex.meaning} 🔊
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trường âm Katakana */}
          <div className="space-y-3 pt-3 border-t border-border/60">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>⚡</span> 2. Quy tắc trường âm trong Katakana (Dấu gạch ngang ー):
            </h4>
            <div className="p-4 sm:p-5 rounded-2xl bg-teal-500/10 border border-teal-500/25 space-y-3">
              <p className="text-xs sm:text-sm text-foreground-muted">
                {chouonRules.katakanaRule.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {chouonRules.katakanaRule.examples.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => playKanaAudio(ex.kana)}
                    className="p-3 rounded-xl bg-surface border border-border/60 hover:border-teal-400 text-left cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="kana-display text-lg font-bold text-foreground">
                        {ex.kana}
                      </span>
                      <span className="text-[10px] text-teal-400">🔊 Nghe</span>
                    </div>
                    <div className="text-xs font-mono text-indigo-light">
                      /{ex.romaji}/
                    </div>
                    <div className="text-xs text-foreground-dim mt-0.5">
                      {ex.meaning}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ NỘI DUNG 3: ÂM MŨI (HATSUON) ══════════ */}
      {activeSection === "hatsuon" && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-border/80 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-border/60 pb-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald/15 px-3 py-1 rounded-full mb-2">
              <span>撥音 • Hatsuon</span>
            </div>
            <h3 className="text-2xl font-black text-foreground">
              {hatsuonRules.title}
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 leading-relaxed">
              {hatsuonRules.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hatsuonRules.variations.map((v, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-surface/70 border border-border/80 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="text-lg font-black font-mono text-emerald-400 mb-1">
                    {v.sound}
                  </div>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    {v.condition}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  {v.examples.map((ex, eIdx) => (
                    <button
                      key={eIdx}
                      type="button"
                      onClick={() => playKanaAudio(ex.kana)}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-surface/90 hover:bg-surface-hover border border-border/60 text-left transition-colors cursor-pointer"
                    >
                      <span className="kana-display font-bold text-foreground text-sm">
                        {ex.kana}
                      </span>
                      <span className="text-[11px] text-foreground-dim">
                        {ex.meaning} 🔊
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ NỘI DUNG 4: CÁC CẶP CHỮ DỄ NHẦM ══════════ */}
      {activeSection === "confusing" && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-border/80 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-border/60 pb-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full mb-2">
              <span>Mẹo Nhận Biết • Confusing Kana</span>
            </div>
            <h3 className="text-2xl font-black text-foreground">
              Các Cặp Chữ Dễ Nhầm Lẫn Trong Tiếng Nhật
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 leading-relaxed">
              So sánh chi tiết các nét vẽ và mẹo ghi nhớ để không bao giờ bị viết nhầm hoặc đọc sai!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confusingKanaPairs.map((pair, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-surface/70 border border-border/80 space-y-3"
              >
                {/* Header hiển thị các chữ cái so sánh */}
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-xs font-bold text-foreground-dim uppercase">
                    {pair.type === "hiragana" ? "🌸 Hiragana" : "⚡ Katakana"}
                  </span>
                  <div className="flex items-center gap-3">
                    {pair.chars.map((char, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => playKanaAudio(char)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface border border-indigo/30 hover:border-indigo transition-all cursor-pointer"
                        title={`Nghe phát âm: ${char}`}
                      >
                        <span className="kana-display text-2xl font-black text-foreground">
                          {char}
                        </span>
                        <span className="text-xs font-mono text-indigo-light">
                          /{pair.romajis[cIdx]}/
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Giải thích điểm khác nhau */}
                <p className="text-xs sm:text-sm leading-relaxed text-foreground-muted">
                  💡 {pair.difference}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
