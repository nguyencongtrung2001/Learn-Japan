"use client";

import { useState } from "react";
import { type KanaItem, hiragana, katakana, dakuten, youon } from "@/data/kana-data";

type Tab = "hiragana" | "katakana";

export default function KanaChart() {
  const [activeTab, setActiveTab] = useState<Tab>("hiragana");

  // Helper to format the standard 46 characters into a proper 5-column Gojuon grid
  const getBaseGrid = (items: KanaItem[]) => {
    const grid: (KanaItem | null)[] = [];
    // A to M rows (first 35 items)
    grid.push(...items.slice(0, 35));
    // Y row (ya, empty, yu, empty, yo)
    grid.push(items[35], null, items[36], null, items[37]);
    // R row (ra, ri, ru, re, ro)
    grid.push(...items.slice(38, 43));
    // W row (wa, empty, empty, empty, wo)
    grid.push(items[43], null, null, null, items[44]);
    // N (n, empty, empty, empty, empty)
    grid.push(items[45], null, null, null, null);
    return grid;
  };

  const currentBase = activeTab === "hiragana" ? hiragana : katakana;
  const currentDakuten = dakuten.filter((k) => k.type === activeTab);
  const currentYouon = youon.filter((k) => k.type === activeTab);

  const baseGrid = getBaseGrid(currentBase);

  const renderCell = (item: KanaItem | null, index: number) => {
    if (!item) {
      return <div key={`empty-${index}`} className="w-full aspect-square" />;
    }
    return (
      <button
        key={item.kana}
        className="glass-card flex flex-col items-center justify-center aspect-square transition-all duration-200 hover:scale-105 hover:!border-indigo hover:text-indigo"
      >
        <span className="kana-display text-2xl sm:text-3xl font-bold mb-1">
          {item.kana}
        </span>
        <span className="text-xs sm:text-sm text-foreground-dim font-medium">
          {item.romaji}
        </span>
      </button>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-surface border border-border w-fit mx-auto shadow-sm">
        <button
          onClick={() => setActiveTab("hiragana")}
          className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === "hiragana"
              ? "bg-indigo text-white shadow-md shadow-indigo/20"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          Hiragana (ひらがな)
        </button>
        <button
          onClick={() => setActiveTab("katakana")}
          className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === "katakana"
              ? "bg-indigo text-white shadow-md shadow-indigo/20"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          Katakana (カタカナ)
        </button>
      </div>

      <div className="space-y-12">
        {/* Gojuon (Basic 46) */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground inline-flex items-center gap-2">
              <span className="w-2 h-6 bg-sakura rounded-full inline-block" />
              Cơ bản (Gojuon)
            </h2>
            <p className="text-sm text-foreground-dim ml-4">
              46 ký tự cơ sở
            </p>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {baseGrid.map((item, index) => renderCell(item, index))}
          </div>
        </section>

        {/* Dakuten (Voiced) */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground inline-flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald rounded-full inline-block" />
              Âm đục (Dakuten & Handakuten)
            </h2>
            <p className="text-sm text-foreground-dim ml-4">
              Ký tự đi kèm dấu " / ゛(Tenten) hoặc ゜ (Maru)
            </p>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {currentDakuten.map((item, index) => renderCell(item, index))}
          </div>
        </section>

        {/* Youon (Combination) */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground inline-flex items-center gap-2">
              <span className="w-2 h-6 bg-gold rounded-full inline-block" />
              Âm ghép (Youon)
            </h2>
            <p className="text-sm text-foreground-dim ml-4">
              Kết hợp với ya, yu, yo viết nhỏ (ゃ, ゅ, ょ)
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {currentYouon.map((item, index) => renderCell(item, index))}
          </div>
        </section>
      </div>
    </div>
  );
}
