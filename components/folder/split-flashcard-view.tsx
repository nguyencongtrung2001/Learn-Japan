"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { CardListItem } from "@/lib/card-utils";
import type { Folder } from "@/db/schema";
import { MinimalFlashcardPlayer } from "./minimal-flashcard-player";

interface SplitFlashcardViewProps {
  folder: Folder;
  cards: CardListItem[];
  onBackToClassic?: () => void;
}

export function SplitFlashcardView({
  folder,
  cards,
  onBackToClassic,
}: SplitFlashcardViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filter list by search query
  const filteredIndices = useMemo(() => {
    if (!searchQuery.trim()) {
      return cards.map((_, idx) => idx);
    }
    const q = searchQuery.toLowerCase().trim();
    return cards
      .map((c, idx) => {
        const matchWord = c.word.toLowerCase().includes(q);
        const matchKanji = c.kanji?.toLowerCase().includes(q) || false;
        const matchTrans = c.translation.toLowerCase().includes(q);
        return matchWord || matchKanji || matchTrans ? idx : -1;
      })
      .filter((idx) => idx !== -1);
  }, [cards, searchQuery]);

  // Auto-scroll left list item into view when activeIndex changes
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  return (
    <div
      className="min-h-[calc(100vh-5rem)] p-4 sm:p-6"
      style={{ backgroundColor: "#F6F7FB" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Bố cục Split-View 3:7 (Màn hình rộng / Tablet) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
          {/* ══════ CỘT TRÁI (30%): DANH SÁCH TOÀN BỘ TỪ VỰNG DẠNG LIST ══════ */}
          <aside className="lg:col-span-3 bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col max-h-[82vh] lg:sticky lg:top-20">
            {/* Header danh sách & Tìm kiếm */}
            <div className="space-y-3 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📑</span>
                  <h3 className="font-bold text-sm text-[#1A1D28]">
                    Danh sách từ ({cards.length})
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#586380] bg-gray-100 px-2 py-0.5 rounded-md">
                  {activeIndex + 1}/{cards.length}
                </span>
              </div>

              {/* Ô tìm kiếm từ vựng */}
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm từ trong bài..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/80 text-xs text-[#1A1D28] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#4255FF] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* List danh sách từ có thanh cuộn mượt mà */}
            <div className="flex-1 overflow-y-auto pt-3 space-y-1.5 pr-1 scrollbar-thin">
              {filteredIndices.length > 0 ? (
                filteredIndices.map((cardIndex) => {
                  const card = cards[cardIndex];
                  const isActive = cardIndex === activeIndex;

                  return (
                    <div
                      key={card.id}
                      ref={(el) => {
                        itemRefs.current[cardIndex] = el;
                      }}
                      onClick={() => setActiveIndex(cardIndex)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all border text-xs flex items-center justify-between gap-2 ${
                        isActive
                          ? "bg-blue-50/90 border-[#4255FF] text-[#1A1D28] shadow-xs"
                          : "bg-white border-transparent hover:border-gray-200 hover:bg-gray-50/70 text-[#586380]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-semibold text-[#1A1D28]">
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4255FF] shrink-0" />
                          )}
                          <span className="truncate">{card.word}</span>
                          {card.kanji && (
                            <span className="text-gray-500 font-jp text-[11px] shrink-0">
                              ({card.kanji})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#586380] truncate mt-0.5">
                          {card.translation}
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-gray-400 shrink-0">
                        #{cardIndex + 1}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-[#586380] italic">
                  Không tìm thấy từ nào khớp với tìm kiếm
                </div>
              )}
            </div>
          </aside>

          {/* ══════ CỘT PHẢI (70%): SÂN KHẤU FLASHCARD ĐANG LẬT ══════ */}
          <main className="lg:col-span-7">
            <MinimalFlashcardPlayer
              folder={folder}
              cards={cards}
              externalIndex={activeIndex}
              onCardChange={(idx) => setActiveIndex(idx)}
              onBackToClassic={onBackToClassic}
              isSplitView={true}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
