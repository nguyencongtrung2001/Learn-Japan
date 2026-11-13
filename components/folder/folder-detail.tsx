"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { updateFolder } from "@/actions/folder-actions";
import { createCard, createCardsBulk, deleteCard, updateCard } from "@/actions/card-actions";
import { useAudio } from "@/hooks/use-audio";
import { MAX_GROWTH_LEVEL } from "@/lib/growth";
import { toCardListItem, type CardInput, type CardListItem } from "@/lib/card-utils";
import type { Folder } from "@/db/schema";
import BulkImport from "@/components/bulk-import";
import { FolderInfoCard } from "./folder-info-card";

import { QuizActions } from "./quiz-actions";
import { FolderEditForm } from "./folder-edit-form";
import { AddCardForm } from "./add-card-form";
import { EditCardModal } from "./edit-card-modal";
import { CardsHeader } from "./cards-header";
import { EmptyCards } from "./empty-cards";
import { VocabGrid } from "./vocab-grid";
import { TransferControls } from "./transfer-controls";
import { ViewSwitcher, type FolderViewMode } from "./view-switcher";
import { MinimalFlashcardPlayer } from "./minimal-flashcard-player";
import { SplitFlashcardView } from "./split-flashcard-view";

interface FolderDetailProps {
  folder: Folder;
  initialCards: CardListItem[];
  /** Thời điểm server render (ms) — dùng để tính thẻ "cần ôn" nhất quán giữa server & client. */
  serverNow: number;
}

/**
 * Component điều phối (client): giữ state danh sách thẻ + các handler.
 * Mọi phần UI đều nằm ở component con; page.tsx chỉ fetch dữ liệu trên server.
 */
export default function FolderDetail({ folder: initialFolder, initialCards, serverNow }: FolderDetailProps) {
  const [folder, setFolder] = useState(initialFolder);
  const [cards, setCards] = useState(initialCards);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingCard, setEditingCard] = useState<CardListItem | null>(null);
  const [now] = useState(serverNow);

  // ---------- View Mode state (Giao diện 1: Classic | Giao diện 2: Minimalist | Split-View) ----------
  const [viewMode, setViewMode] = useState<FolderViewMode>(() => {
    if (typeof window === "undefined") return "classic";
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = urlParams.get("view");
      if (urlView === "minimal" || urlView === "split" || urlView === "classic") {
        return urlView;
      }
      const saved = localStorage.getItem("preferred_folder_view");
      if (saved === "minimal" || saved === "split") {
        return saved;
      }
    } catch {
      // ignore
    }
    return "classic";
  });

  const handleChangeViewMode = (mode: FolderViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("preferred_folder_view", mode);
      const url = new URL(window.location.href);
      if (mode === "classic") {
        url.searchParams.delete("view");
      } else {
        url.searchParams.set("view", mode);
      }
      window.history.replaceState({}, "", url.toString());
    } catch {
      // ignore
    }
  };

  // ---------- Transfer (multi‑select) state ----------
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectedCards = cards.filter((c) => selectedIds.has(c.id));
  // ---------------------------------------------------

  // Ref giữ bản mới nhất để các handler có identity ổn định (không phá React.memo của thẻ).
  const cardsRef = useRef(cards);
  const commitCards = useCallback((next: CardListItem[]) => {
    cardsRef.current = next;
    setCards(next);
  }, []);

  const playAudio = useAudio(folder.language === "japanese" ? "ja" : "en-US");
  const folderId = folder.id;
  const maxCards = folder.maxCards;

  const { newCount, dueCount, learnedCount } = useMemo(() => {
    let fresh = 0;
    let due = 0;
    let learned = 0;
    for (const c of cards) {
      if (c.growthLevel > 0) learned++;
      if (c.growthLevel < MAX_GROWTH_LEVEL) fresh++;
      else if (c.nextReviewAt <= now) due++;
    }
    return { newCount: fresh, dueCount: due, learnedCount: learned > 0 ? learned : cards.length };
  }, [cards, now]);

  const handleCreate = useCallback(
    async (input: CardInput): Promise<boolean> => {
      if (maxCards && cardsRef.current.length >= maxCards) {
        alert(`Đã đạt giới hạn ${maxCards} từ cho thư mục này.`);
        return false;
      }
      try {
        const created = await createCard({ folderId, ...input });
        commitCards([toCardListItem(created), ...cardsRef.current]);
        return true;
      } catch (error) {
        console.error("Lỗi tạo thẻ:", error);
        alert("Không thể lưu thẻ. Vui lòng thử lại.");
        return false;
      }
    },
    [folderId, maxCards, commitCards]
  );

  // Xóa lạc quan: gỡ thẻ khỏi UI ngay, lỗi thì hoàn tác.
  const handleDelete = useCallback(
    async (cardId: number) => {
      if (!confirm("Xóa thẻ từ vựng này?")) return;
      const snapshot = cardsRef.current;
      commitCards(snapshot.filter((c) => c.id !== cardId));
      try {
        await deleteCard(cardId, folderId);
      } catch (error) {
        console.error("Lỗi xóa thẻ:", error);
        commitCards(snapshot);
        alert("Không thể xóa thẻ. Vui lòng thử lại.");
      }
    },
    [folderId, commitCards]
  );

  // Import nhanh: 1 lần insert theo lô (server tự áp giới hạn maxCards).
  const handleImport = useCallback(
    async (rows: CardInput[]): Promise<number> => {
      const { created } = await createCardsBulk(folderId, rows);
      if (created.length > 0) {
        commitCards([...created.map(toCardListItem).reverse(), ...cardsRef.current]);
      }
      return created.length;
    },
    [folderId, commitCards]
  );

  const handleSaveFolder = useCallback(
    async (data: { name: string; description?: string; maxCards?: number }): Promise<boolean> => {
      try {
        const updated = await updateFolder(folderId, data);
        if (!updated) return false;
        setFolder(updated);
        setEditing(false);
        return true;
      } catch (error) {
        console.error("Lỗi cập nhật thư mục:", error);
        return false;
      }
    },
    [folderId]
  );

  const handleUpdateCard = useCallback(
    async (cardId: number, input: CardInput): Promise<boolean> => {
      try {
        const updated = await updateCard(cardId, {
          word: input.word,
          kanji: input.kanji,
          translation: input.translation,
          partOfSpeech: input.partOfSpeech,
          phonetic: input.phonetic,
          definition: input.definition,
          example: input.example,
          imageUrl: input.imageUrl,
          folderId,
        });
        if (!updated) return false;

        commitCards(
          cardsRef.current.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  word: input.word,
                  kanji: input.kanji || null,
                  translation: input.translation,
                  partOfSpeech: input.partOfSpeech || null,
                  phonetic: input.phonetic || null,
                  definition: input.definition || null,
                  example: input.example || null,
                  imageUrl: input.imageUrl || null,
                }
              : c
          )
        );
        setEditingCard(null);
        return true;
      } catch (error) {
        console.error("Lỗi cập nhật thẻ:", error);
        alert("Không thể cập nhật thẻ. Vui lòng thử lại.");
        return false;
      }
    },
    [folderId, commitCards]
  );

  if (viewMode === "minimal") {
    return (
      <div className="h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] overflow-hidden flex flex-col bg-transparent">
        <MinimalFlashcardPlayer
          folder={folder}
          cards={cards}
          onBackToClassic={() => handleChangeViewMode("classic")}
          viewSwitcher={
            <ViewSwitcher
              currentMode={viewMode}
              onChangeMode={handleChangeViewMode}
              cardsCount={cards.length}
            />
          }
        />
      </div>
    );
  }

  if (viewMode === "split") {
    return (
      <div className="h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] overflow-hidden flex flex-col bg-transparent">
        <SplitFlashcardView
          folder={folder}
          cards={cards}
          onBackToClassic={() => handleChangeViewMode("classic")}
          viewSwitcher={
            <ViewSwitcher
              currentMode={viewMode}
              onChangeMode={handleChangeViewMode}
              cardsCount={cards.length}
            />
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* ═══════ SIDEBAR ═══════ */}
        <aside className="w-full shrink-0 lg:w-64 xl:w-72">
          <div className="space-y-5 lg:sticky lg:top-20">
            <FolderInfoCard
              folder={folder}
              total={cards.length}
              newCount={newCount}
              dueCount={dueCount}
              editing={editing}
            />

            {/* Transfer controls */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelecting((v) => !v);
                  if (selecting) setSelectedIds(new Set());
                }}
                className={`w-full cursor-pointer rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                  selecting
                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-[#E2E4E9] bg-white text-[#586380] hover:bg-[#EDEFF4] hover:text-[#1A1D28]"
                }`}
              >
                {selecting ? "✖️ Hủy chọn" : "🔀 Chọn để chuyển"}
              </button>
              {selecting && selectedCards.length > 0 && (
                <TransferControls
                  sourceFolderId={folder.id}
                  selectedCards={selectedCards}
                  onTransferSuccess={(movedIds: number[]) => {
                    const movedSet = new Set(movedIds);
                    commitCards(cardsRef.current.filter((c) => !movedSet.has(c.id)));
                    setSelectedIds(new Set());
                    setSelecting(false);
                  }}
                />
              )}
            </div>

            <QuizActions
              folderId={folderId}
              total={cards.length}
              newCount={newCount}
              dueCount={dueCount}
              learnedCount={learnedCount}
            />

            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                editing
                  ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border border-[#E2E4E9] bg-white text-[#586380] hover:bg-[#EDEFF4] hover:text-[#1A1D28]"
              }`}
            >
              {editing ? "❌ Hủy chỉnh sửa" : "✏️ Chỉnh sửa Thư Mục"}
            </button>

            {editing && (
              <FolderEditForm
                folder={folder}
                total={cards.length}
                onSave={handleSaveFolder}
                onCancel={() => setEditing(false)}
              />
            )}
          </div>
        </aside>

        {/* ═══════ DANH SÁCH THẺ ═══════ */}
        <main className="min-w-0 flex-1">
          {/* Form Thêm Thẻ Từ Vựng */}
          {showCardForm && (
            <AddCardForm
              folderLanguage={folder.language}
              onSubmit={handleCreate}
              onClose={() => setShowCardForm(false)}
            />
          )}

          {/* Form Nhập Nhanh Từ Vựng - Nằm ở trên grid list card thẻ từ vựng */}
          {showBulkImport && (
            <BulkImport
              folderLanguage={folder.language}
              onImport={handleImport}
              onClose={() => setShowBulkImport(false)}
            />
          )}

          <CardsHeader
            count={cards.length}
            onToggleAddCard={() => {
              setShowCardForm((v) => !v);
              if (!showCardForm) setShowBulkImport(false);
            }}
            onToggleBulkImport={() => {
              setShowBulkImport((v) => !v);
              if (!showBulkImport) setShowCardForm(false);
            }}
            showCardForm={showCardForm}
            showBulkImport={showBulkImport}
            viewMode={viewMode}
            onChangeMode={handleChangeViewMode}
          />

          {cards.length === 0 ? (
            <EmptyCards
              onAddCard={() => {
                setShowCardForm(true);
                setShowBulkImport(false);
              }}
              onBulkImport={() => {
                setShowBulkImport(true);
                setShowCardForm(false);
              }}
            />
          ) : (
            <VocabGrid
              cards={cards}
              now={now}
              onPlay={playAudio}
              onDelete={handleDelete}
              onEdit={(card) => setEditingCard(card)}
              selecting={selecting}
              selectedIds={selectedIds}
              toggleSelect={toggleSelect}
            />
          )}
        </main>
      </div>

      {/* Modal chỉnh sửa thẻ từ vựng */}
      <EditCardModal
        card={editingCard}
        folderLanguage={folder.language}
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={handleUpdateCard}
      />
    </div>
  );
}
