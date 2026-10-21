"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getFolderById, updateFolder } from "@/actions/folder-actions";
import { getCardsByFolder, createCard, deleteCard } from "@/actions/card-actions";
import type { Folder, Card } from "@/db/schema";
import BulkImport from "@/components/bulk-import";

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
  // edit mode for folder metadata
  const [editMode, setEditMode] = useState(false);
  const [editDescription, setEditDescription] = useState<string>('');
  const [editLimit, setEditLimit] = useState<string>('');

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

    // enforce folder card maxCards
    if (folder?.maxCards && cardsList.length >= folder.maxCards) {
      alert(`Đã đạt giới hạn ${folder.maxCards} từ cho thư mục này.`);
      return;
    }

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
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 sm:py-12">

      {/* Two-column layout: sidebar 30% | cards 70% */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ═══════ LEFT SIDEBAR (30%) ═══════ */}
        <aside className="w-full lg:w-[30%] lg:min-w-[280px] lg:max-w-[380px] flex-shrink-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Folder title card */}
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sakura to-indigo opacity-60" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo/5 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">📂</span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    <span className="gradient-text">{folder.name}</span>
                  </h1>
                </div>
                {folder.description && !editMode && (
                  <p className="text-foreground-muted text-sm leading-relaxed mb-4">{folder.description}</p>
                )}

                {/* Limit progress bar */}
                {folder.maxCards && !editMode && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-foreground-muted uppercase tracking-wide">Giới hạn</span>
                      <span className={`text-xs font-extrabold ${cardsList.length >= folder.maxCards ? 'text-rose' : 'text-emerald'}`}>
                        {cardsList.length} / {folder.maxCards}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-surface border border-border/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          cardsList.length >= folder.maxCards
                            ? 'bg-gradient-to-r from-rose to-red-500'
                            : cardsList.length >= folder.maxCards * 0.8
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : 'bg-gradient-to-r from-emerald to-teal-500'
                        }`}
                        style={{ width: `${Math.min((cardsList.length / folder.maxCards) * 100, 100)}%` }}
                      />
                    </div>
                    {cardsList.length >= folder.maxCards && (
                      <p className="text-rose text-xs mt-1 font-semibold animate-pulse">⚠️ Đã đạt giới hạn!</p>
                    )}
                  </div>
                )}

                {/* Stats badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-surface border border-border/50 px-3 py-1 rounded-full text-xs font-medium text-foreground-dim shadow-sm">
                    📚 {cardsList.length} thẻ
                  </span>
                  <span className="bg-emerald/10 border border-emerald/20 px-3 py-1 rounded-full text-xs font-bold text-emerald shadow-sm">
                    🌱 {newCards.length} chưa học
                  </span>
                  <span className="bg-sakura/10 border border-sakura/20 px-3 py-1 rounded-full text-xs font-bold text-sakura-light shadow-sm">
                    💧 {dueCards.length} cần ôn
                  </span>
                </div>
              </div>
            </div>

            {/* Quiz buttons */}
            <div className="flex flex-col gap-3">
              {newCards.length > 0 && cardsList.length >= 4 && (
                <Link
                  href={`/folders/${folderId}/quiz`}
                  className="text-center btn-shine px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald to-teal-500 text-white font-bold
                             hover:shadow-xl hover:shadow-emerald/30 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                  🌱 Học Mới ({Math.min(newCards.length, 5)})
                </Link>
              )}
              {dueCards.length > 0 && (
                <Link
                  href={`/folders/${folderId}/quiz`}
                  className="text-center btn-shine px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sakura to-indigo text-white font-bold
                             hover:shadow-xl hover:shadow-sakura/30 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                  💧 Ôn Tập ({dueCards.length})
                </Link>
              )}
            </div>

            {/* Edit toggle button */}
            <button
              onClick={() => {
                setEditDescription(folder.description ?? '');
                setEditLimit(folder.maxCards ? folder.maxCards.toString() : '');
                setEditMode(!editMode);
              }}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
                editMode
                  ? 'bg-rose/10 text-rose border border-rose/20 hover:bg-rose/20'
                  : 'bg-indigo/10 text-indigo-light border border-indigo/20 hover:bg-indigo/20'
              }`}
            >
              {editMode ? '❌ Hủy chỉnh sửa' : '✏️ Chỉnh sửa Thư Mục'}
            </button>

            {/* Edit form panel */}
            {editMode && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await updateFolder(folder.id, {
                    name: folder.name,
                    description: editDescription.trim() || undefined,
                    maxCards: editLimit ? parseInt(editLimit, 10) : undefined,
                  });
                  if (res) {
                    loadData();
                    setEditMode(false);
                  } else {
                    alert('Cập nhật thất bại');
                  }
                }}
                className="glass-card p-5 space-y-4 animate-fade-in shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo to-sakura opacity-60" />
                <h3 className="text-base font-extrabold gradient-text flex items-center gap-2">
                  ⚙️ Cài đặt Thư Mục
                </h3>
                <div>
                  <label className="block text-xs font-bold text-foreground-muted mb-1.5 uppercase tracking-wide">
                    Mô tả (tùy chọn)
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Mô tả nội dung thư mục..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-surface/50 border-2 border-border/50 text-foreground text-sm font-medium
                               outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/10 transition-all placeholder:text-foreground-muted/40 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground-muted mb-1.5 uppercase tracking-wide">
                    Giới hạn số từ
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    placeholder="VD: 50 (trống = ∞)"
                    className="w-full px-4 py-3 rounded-xl bg-surface/50 border-2 border-border/50 text-foreground text-sm font-medium
                               outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/10 transition-all placeholder:text-foreground-muted/40"
                  />
                  <p className="text-foreground-dim text-xs mt-1.5">
                    💡 {cardsList.length} từ hiện tại. {editLimit ? `Giới hạn: ${editLimit}.` : 'Không giới hạn.'}
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald to-teal-500 text-white
                               hover:shadow-lg hover:shadow-emerald/30 hover:-translate-y-0.5 active:translate-y-0
                               transition-all duration-300 cursor-pointer"
                  >
                    ✅ Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-surface border border-border/50 text-foreground-muted
                               hover:bg-rose/10 hover:text-rose hover:border-rose/20 transition-all duration-300 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowCardForm(!showCardForm)}
                className="w-full px-5 py-3 rounded-xl border-2 border-indigo/20 bg-indigo/5 text-indigo-light font-bold text-sm
                           hover:bg-indigo hover:border-indigo hover:text-white hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm"
              >
                {showCardForm ? "✕ Đóng Form" : "＋ Thêm Thẻ Mới"}
              </button>
              <BulkImport onImport={handleExcelImport} />
            </div>
          </div>
        </aside>

        {/* ═══════ RIGHT MAIN AREA (70%) ═══════ */}
        <main className="flex-1 min-w-0">
          {/* Add Card Form */}
          {showCardForm && (
            <form
              onSubmit={handleCreateCard}
              className="glass-card p-6 sm:p-8 mb-8 animate-fade-in shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo to-sakura opacity-50" />
              <h3 className="font-extrabold text-xl mb-6 text-center gradient-text">Thêm Thẻ Từ Vựng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-foreground-muted mb-2 uppercase tracking-wide">Từ vựng <span className="text-rose">*</span></label>
                  <input type="text" value={word} onChange={(e) => setWord(e.target.value)} placeholder="VD: apple" required className="w-full px-5 py-4 rounded-2xl bg-surface/50 border-2 border-border/50 text-foreground outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/10 transition-all font-bold text-xl placeholder:font-normal placeholder:text-foreground-muted/40" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground-muted mb-2 uppercase tracking-wide">Nghĩa tiếng Việt <span className="text-rose">*</span></label>
                  <input type="text" value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="Quả táo" required className="w-full px-5 py-3.5 rounded-2xl bg-surface/50 border-2 border-border/50 text-foreground outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/10 transition-all font-medium placeholder:text-foreground-muted/40" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground-muted mb-2 uppercase tracking-wide">Phiên âm IPA</label>
                  <input type="text" value={phonetic} onChange={(e) => setPhonetic(e.target.value)} placeholder="/ˈæp.əl/" className="w-full px-5 py-3.5 rounded-2xl bg-surface/50 border-2 border-border/50 text-indigo-light outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/10 transition-all font-medium placeholder:text-foreground-muted/40" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-foreground-muted mb-2 uppercase tracking-wide">Định nghĩa tiếng Anh (tùy chọn)</label>
                  <textarea value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="A round fruit with red or green skin..." rows={2} className="w-full px-5 py-3.5 rounded-2xl bg-surface/50 border-2 border-border/50 text-foreground outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/10 transition-all resize-none placeholder:text-foreground-muted/40" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-foreground-muted mb-2 uppercase tracking-wide">Ví dụ (tùy chọn)</label>
                  <textarea value={example} onChange={(e) => setExample(e.target.value)} placeholder="I ate an apple." rows={2} className="w-full px-5 py-3.5 rounded-2xl bg-surface/50 border-2 border-border/50 text-foreground outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/10 transition-all resize-none placeholder:text-foreground-muted/40" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting || !word.trim() || !translation.trim()} className="w-full mt-6 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-sakura to-indigo text-white hover:shadow-lg hover:shadow-indigo/30 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none">
                {isSubmitting ? "⏳ Đang lưu..." : "💾 Lưu Thẻ"}
              </button>
            </form>
          )}

          {/* Cards header */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold gradient-text">🃏 Danh Sách Thẻ</h2>
            <span className="text-sm font-semibold text-foreground-muted bg-surface px-3 py-1 rounded-full border border-border/50">{cardsList.length} Thẻ</span>
          </div>

          {/* Cards grid */}
          {cardsList.length === 0 ? (
            <div className="text-center py-20 glass-card border-dashed border-2 border-border/50">
              <div className="text-6xl mb-6">📭</div>
              <p className="text-lg font-bold text-foreground mb-2">Thư mục đang trống</p>
              <p className="text-foreground-muted text-sm">Bấm &quot;Thêm Thẻ Mới&quot; hoặc &quot;Nhập nhanh&quot; để tạo từ vựng.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {cardsList.map((card, index) => {
                const isDue = new Date(card.nextReview) <= new Date();
                return (
                  <div key={card.id} className={`glass-card p-5 flex flex-col justify-between gap-4 animate-fade-in-up group hover:shadow-xl transition-all duration-300 border-l-4 ${isDue ? "border-l-sakura bg-sakura/5" : "border-l-indigo/50"}`} style={{ animationDelay: `${index * 0.02}s` }}>
                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <span className="text-2xl font-extrabold text-foreground tracking-tight">{card.word}</span>
                          {card.phonetic && <span className="bg-indigo/10 text-indigo-light px-2 py-0.5 rounded text-xs font-bold">{card.phonetic}</span>}
                        </div>
                        <div className="mb-3">
                          <span className="text-lg font-bold text-foreground/90">{card.translation}</span>
                        </div>
                        {card.definition && <div className="text-foreground-muted text-sm mb-2 leading-relaxed line-clamp-2">{card.definition}</div>}
                        {card.example && <div className="bg-surface/50 p-2.5 rounded-lg border border-border/50 text-foreground-dim text-sm italic line-clamp-2 border-l-2 border-l-emerald/50">&quot;{card.example}&quot;</div>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                      <div className="flex items-center gap-2" title="Tiến độ học">
                        <span className="text-xl">{growthIcon(card.growthLevel)}</span>
                        <span className="text-xs font-semibold text-foreground-muted">Level {card.growthLevel}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => playAudio(card.word)} className="p-2.5 rounded-xl bg-surface hover:bg-indigo/10 text-indigo-light hover:text-indigo transition-colors shadow-sm" title="Nghe phát âm">
                          🔊
                        </button>
                        <button onClick={() => handleDeleteCard(card.id)} className="p-2.5 rounded-xl bg-surface hover:bg-rose/10 text-rose/70 hover:text-rose transition-colors shadow-sm" title="Xóa thẻ">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
