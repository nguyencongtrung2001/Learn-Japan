"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getFolderById } from "@/actions/folder-actions";
import { getCardsByFolder, createCard, deleteCard, getFolderStats } from "@/actions/card-actions";
import type { Folder, Card } from "@/db/schema";
import ExcelImport from "@/components/excel-import";

export default function FolderDetailPage() {
  const params = useParams();
  const folderId = params.id as string;

  const [folder, setFolder] = useState<Folder | null>(null);
  const [cardsList, setCardsList] = useState<Card[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [kanji, setKanji] = useState("");
  const [kana, setKana] = useState("");
  const [romaji, setRomaji] = useState("");
  const [meaning, setMeaning] = useState("");
  const [usage, setUsage] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [folderData, cardsData] = await Promise.all([
      getFolderById(folderId),
      getCardsByFolder(folderId),
    ]);
    setFolder(folderData || null);
    setCardsList(cardsData);
    setIsLoading(false);
  }, [folderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kana.trim() || !romaji.trim() || !meaning.trim()) return;
    setIsSubmitting(true);
    await createCard({
      folderId,
      kanji: kanji.trim() || undefined,
      kana: kana.trim(),
      romaji: romaji.trim(),
      meaning: meaning.trim(),
      usage: usage.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    });
    setKanji("");
    setKana("");
    setRomaji("");
    setMeaning("");
    setUsage("");
    setImageUrl("");
    setIsSubmitting(false);
    loadData();
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm("Xóa thẻ từ vựng này?")) return;
    await deleteCard(cardId, folderId);
    loadData();
  };

  const playAudio = (text: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=ja`);
    audioRef.current = audio;
    audio.play();
  };

  const handleExcelImport = async (
    rows: { kanji?: string; kana: string; romaji: string; meaning: string; usage?: string; imageUrl?: string }[]
  ) => {
    for (const row of rows) {
      await createCard({
        folderId,
        kanji: row.kanji,
        kana: row.kana,
        romaji: row.romaji,
        meaning: row.meaning,
        usage: row.usage,
        imageUrl: row.imageUrl,
      });
    }
    loadData();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="inline-block w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="text-center py-20">
        <p className="text-foreground-muted">Không tìm thấy thư mục.</p>
        <Link href="/folders" className="text-indigo-light hover:underline text-sm mt-2 inline-block">
          ← Quay lại
        </Link>
      </div>
    );
  }

  const newCards = cardsList.filter((c) => c.growthLevel < 7);
  const plantedCards = cardsList.filter((c) => c.growthLevel === 7);
  const dueCards = plantedCards.filter((c) => new Date(c.nextReview) <= new Date());

  const growthIcon = (level: number) => {
    const icons = ["🌰", "🌱", "🪴", "☘️", "🌿", "🌷", "🌸", "🌺"];
    return icons[Math.min(level, 7)];
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/folders"
          className="text-foreground-muted hover:text-indigo-light text-sm transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← Quay lại danh sách
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="mr-2">📂</span>
              <span className="gradient-text">{folder.name}</span>
            </h1>
            {folder.description && (
              <p className="text-foreground-muted text-sm mt-1">{folder.description}</p>
            )}
            <p className="text-foreground-dim text-xs mt-2">
              {cardsList.length} thẻ · {newCards.length} chưa học · {plantedCards.length} đã nở 🌺 · {dueCards.length} cần ôn
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {newCards.length > 0 && cardsList.length >= 4 && (
              <Link
                href={`/folders/${folderId}/quiz`}
                className="btn-shine px-4 py-2 rounded-xl bg-gradient-to-r from-emerald to-teal-500 text-white font-semibold
                           hover:shadow-xl hover:shadow-emerald/20 hover:scale-105 transition-all duration-300 text-sm"
              >
                🌱 Học mới ({Math.min(newCards.length, 5)})
              </Link>
            )}
            {dueCards.length > 0 && (
              <Link
                href={`/folders/${folderId}/quiz`}
                className="btn-shine px-4 py-2 rounded-xl bg-gradient-to-r from-sakura to-indigo text-white font-semibold
                           hover:shadow-xl hover:shadow-sakura/20 hover:scale-105 transition-all duration-300 text-sm"
              >
                💧 Ôn tập ({dueCards.length})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Add card buttons */}
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl border border-border text-foreground-muted font-medium
                     hover:bg-surface-hover hover:text-foreground transition-all duration-200 cursor-pointer text-sm"
        >
          {showForm ? "✕ Đóng form" : "＋ Thêm thẻ mới"}
        </button>
        <ExcelImport onImport={handleExcelImport} />
      </div>

      {/* Add card form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="glass-card p-6 max-w-2xl mx-auto mb-8 animate-fade-in"
        >
          <h3 className="font-bold text-lg mb-4 text-center gradient-text">Thêm thẻ từ vựng</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Kanji (tùy chọn)</label>
              <input
                type="text" value={kanji} onChange={(e) => setKanji(e.target.value)}
                placeholder="食べる" className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all text-lg kana-display"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">
                Kana <span className="text-rose">*</span>
              </label>
              <input
                type="text" value={kana} onChange={(e) => setKana(e.target.value)}
                placeholder="たべる" required className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all text-lg kana-display"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">
                Romaji <span className="text-rose">*</span>
              </label>
              <input
                type="text" value={romaji} onChange={(e) => setRomaji(e.target.value)}
                placeholder="taberu" required className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">
                Nghĩa tiếng Việt <span className="text-rose">*</span>
              </label>
              <input
                type="text" value={meaning} onChange={(e) => setMeaning(e.target.value)}
                placeholder="Ăn" required className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-foreground-muted mb-1">Cách sử dụng / Ví dụ (tùy chọn)</label>
              <input
                type="text" value={usage} onChange={(e) => setUsage(e.target.value)}
                placeholder="ごはんを食べる (Ăn cơm)" className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-foreground-muted mb-1">Link hình ảnh (tùy chọn)</label>
              <input
                type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg" className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all text-sm"
              />
            </div>
          </div>
          <button
            type="submit" disabled={isSubmitting || !kana.trim() || !romaji.trim() || !meaning.trim()}
            className="w-full mt-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-sakura to-indigo text-white
                       hover:shadow-lg hover:shadow-sakura/25 hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang lưu..." : "💾 Lưu thẻ"}
          </button>
        </form>
      )}

      {/* Cards list */}
      {cardsList.length === 0 ? (
        <div className="text-center py-16 glass-card max-w-md mx-auto">
          <div className="text-5xl mb-4">🃏</div>
          <p className="text-foreground-muted">Chưa có thẻ nào trong thư mục này</p>
          <p className="text-foreground-dim text-sm mt-1">
            Bấm &quot;Thêm thẻ mới&quot; để bắt đầu!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cardsList.map((card, index) => {
            const isDue = new Date(card.nextReview) <= new Date();
            return (
              <div
                key={card.id}
                className={`glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in-up group ${
                  isDue ? "border-l-2 border-l-sakura" : ""
                }`}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                {/* Image preview */}
                {card.imageUrl && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border/50">
                    <img
                      src={card.imageUrl}
                      alt={card.meaning}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    {card.kanji && (
                      <span className="kana-display text-2xl font-bold text-foreground">
                        {card.kanji}
                      </span>
                    )}
                    <span className="kana-display text-lg text-indigo-light">
                      {card.kana}
                    </span>
                    <span className="text-foreground-dim text-sm">
                      [{card.romaji}]
                    </span>
                    <span className="text-sm" title={`Growth Level: ${card.growthLevel}`}>
                      {growthIcon(card.growthLevel)}
                    </span>
                  </div>
                  <p className="text-foreground-muted text-sm mt-0.5">{card.meaning}</p>
                  {card.usage && (
                    <p className="text-foreground-dim text-xs mt-0.5 italic">💬 {card.usage}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => playAudio(card.kanji || card.kana)}
                    className="p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                    title="Phát âm"
                  >
                    🔊
                  </button>
                  {isDue && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sakura/15 text-sakura-light">
                      💧 Cần ôn
                    </span>
                  )}
                  {card.growthLevel < 7 && card.growthLevel > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald/15 text-emerald">
                      Lv.{card.growthLevel}/7
                    </span>
                  )}
                  {card.growthLevel === 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-foreground-dim/15 text-foreground-dim">
                      Chưa học
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-2 rounded-lg text-rose/50 hover:bg-rose/10 hover:text-rose
                               transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
