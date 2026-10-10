"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getFolderById } from "@/actions/folder-actions";
import { getCardsByFolder, createCard, deleteCard } from "@/actions/card-actions";
import type { Folder, Card } from "@/db/schema";
import ExcelImport from "@/components/excel-import";

export default function FolderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const folderIdString = unwrappedParams.id;
  const folderId = parseInt(folderIdString, 10);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [cardsList, setCardsList] = useState<Card[]>([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Card Form fields
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadData = useCallback(async () => {
    if (isNaN(folderId)) return;
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

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;

    setIsSubmitting(true);
    await createCard({
      folderId,
      word: word.trim(),
      translation: translation.trim(),
      definition: definition.trim() || undefined,
      example: example.trim() || undefined,
      phonetic: phonetic.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    });
    setWord("");
    setTranslation("");
    setDefinition("");
    setExample("");
    setPhonetic("");
    setImageUrl("");
    setIsSubmitting(false);
    loadData();
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm("Xóa thẻ từ vựng này?")) return;
    await deleteCard(cardId, folderId);
    loadData();
  };

  const playAudio = (text: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=en-US`);
    audioRef.current = audio;
    audio.play();
  };

  const handleExcelImport = async (
    rows: { word?: string; translation: string; definition?: string; example?: string; phonetic?: string; imageUrl?: string }[]
  ) => {
    for (const row of rows) {
      if (!row.word || !row.translation) continue;
      await createCard({
        folderId,
        word: row.word,
        translation: row.translation,
        definition: row.definition,
        example: row.example,
        phonetic: row.phonetic,
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

  const newCards = cardsList.filter((c) => c.growthLevel < 6);
  const plantedCards = cardsList.filter((c) => c.growthLevel === 6);
  const dueCards = plantedCards.filter((c) => new Date(c.nextReview) <= new Date());

  const growthIcon = (level: number) => {
    const icons = ["🌰", "🌱", "🪴", "☘️", "🌿", "🌷", "🌺"];
    return icons[Math.min(level, 6)];
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-foreground-muted hover:text-indigo-light text-sm transition-colors inline-flex items-center gap-1 mb-4 cursor-pointer"
        >
          ← Quay lại
        </button>
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
              {cardsList.length} thẻ · {newCards.length} chưa học · {dueCards.length} cần ôn
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

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        <button
          onClick={() => {
            setShowCardForm(!showCardForm);
          }}
          className="px-5 py-2.5 rounded-xl border border-border text-foreground-muted font-medium
                     hover:bg-surface-hover hover:text-foreground transition-all duration-200 cursor-pointer text-sm"
        >
          {showCardForm ? "✕ Đóng form" : "＋ Thêm thẻ từ vựng"}
        </button>
        <ExcelImport onImport={handleExcelImport} />
      </div>

      {/* Add Card Form */}
      {showCardForm && (
        <form
          onSubmit={handleCreateCard}
          className="glass-card p-6 max-w-2xl mx-auto mb-8 animate-fade-in"
        >
          <h3 className="font-bold text-lg mb-4 text-center gradient-text">Thêm thẻ từ vựng</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-foreground-muted mb-1">Từ vựng <span className="text-rose">*</span></label>
              <input type="text" value={word} onChange={(e) => setWord(e.target.value)} placeholder="apple" required className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all font-bold text-lg" />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Nghĩa tiếng Việt <span className="text-rose">*</span></label>
              <input type="text" value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="Quả táo" required className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Phiên âm IPA</label>
              <input type="text" value={phonetic} onChange={(e) => setPhonetic(e.target.value)} placeholder="/ˈæp.əl/" className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all text-indigo-light" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-foreground-muted mb-1">Định nghĩa tiếng Anh (tùy chọn)</label>
              <input type="text" value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="A round fruit with red or green skin" className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-foreground-muted mb-1">Ví dụ (tùy chọn)</label>
              <input type="text" value={example} onChange={(e) => setExample(e.target.value)} placeholder="I ate an apple." className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-foreground-muted mb-1">Link hình ảnh (tùy chọn)</label>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/20 transition-all text-sm" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting || !word.trim() || !translation.trim()} className="w-full mt-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-sakura to-indigo text-white hover:scale-[1.02] transition-all disabled:opacity-50">
            {isSubmitting ? "Đang lưu..." : "💾 Lưu thẻ"}
          </button>
        </form>
      )}

      {/* Cards list */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4 gradient-text">🃏 Thẻ từ vựng</h2>
      </div>
      
      {cardsList.length === 0 ? (
        <div className="text-center py-16 glass-card max-w-md mx-auto">
          <div className="text-5xl mb-4">🃏</div>
          <p className="text-foreground-muted">Chưa có thẻ nào trong thư mục này</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cardsList.map((card, index) => {
            const isDue = new Date(card.nextReview) <= new Date();
            return (
              <div key={card.id} className={`glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in-up group ${isDue ? "border-l-2 border-l-sakura" : ""}`} style={{ animationDelay: `${index * 0.03}s` }}>
                {card.imageUrl && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border/50">
                    <img src={card.imageUrl} alt={card.translation} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-bold text-foreground">{card.word}</span>
                    {card.phonetic && <span className="text-indigo-light text-sm">{card.phonetic}</span>}
                    <span className="text-sm">{growthIcon(card.growthLevel)}</span>
                  </div>
                  <div className="mt-1">
                    <span className="font-medium text-foreground">{card.translation}</span>
                  </div>
                  {card.definition && <div className="text-foreground-dim text-sm mt-1">{card.definition}</div>}
                  {card.example && <div className="text-foreground-dim text-sm mt-1 italic">"{card.example}"</div>}
                </div>
                <div className="flex sm:flex-col gap-2 mt-3 sm:mt-0 shrink-0">
                  <button onClick={() => playAudio(card.word)} className="p-2 rounded-xl bg-surface hover:bg-surface-hover text-indigo-light transition-colors" title="Nghe phát âm">
                    🔊
                  </button>
                  <button onClick={() => handleDeleteCard(card.id)} className="p-2 rounded-xl bg-surface hover:bg-rose/10 text-rose/70 hover:text-rose transition-colors" title="Xóa thẻ">
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
