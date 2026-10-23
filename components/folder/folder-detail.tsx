"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { updateFolder } from "@/actions/folder-actions";
import { createCard, createCardsBulk, deleteCard } from "@/actions/card-actions";
import { useAudio } from "@/hooks/use-audio";
import { MAX_GROWTH_LEVEL } from "@/lib/growth";
import { toCardListItem, type CardInput, type CardListItem } from "@/lib/card-utils";
import type { Folder } from "@/db/schema";
import BulkImport from "@/components/bulk-import";
import { FolderInfoCard } from "./folder-info-card";

import { QuizActions } from "./quiz-actions";
import { FolderEditForm } from "./folder-edit-form";
import { AddCardForm } from "./add-card-form";
import { CardsHeader } from "./cards-header";
import { EmptyCards } from "./empty-cards";
import { VocabGrid } from "./vocab-grid";
import { TransferControls } from "./transfer-controls";

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
  const [editing, setEditing] = useState(false);
  const [now] = useState(serverNow);

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

  const playAudio = useAudio();
  const folderId = folder.id;
  const maxCards = folder.maxCards;

  const { newCount, dueCount } = useMemo(() => {
    let fresh = 0;
    let due = 0;
    for (const c of cards) {
      if (c.growthLevel < MAX_GROWTH_LEVEL) fresh++;
      else if (c.nextReviewAt <= now) due++;
    }
    return { newCount: fresh, dueCount: due };
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
    async (data: { description?: string; maxCards?: number }): Promise<boolean> => {
      try {
        const updated = await updateFolder(folderId, { name: folder.name, ...data });
        if (!updated) return false;
        setFolder(updated);
        setEditing(false);
        return true;
      } catch (error) {
        console.error("Lỗi cập nhật thư mục:", error);
        return false;
      }
    },
    [folderId, folder.name]
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* ═══════ SIDEBAR ═══════ */}
        <aside className="w-full shrink-0 lg:w-64 xl:w-72">
          <div className="space-y-5 lg:sticky lg:top-24">
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
                className={`w-full cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-300 ${selecting
                    ? "border-rose/20 bg-rose/10 text-rose hover:bg-rose/20"
                    : "border-indigo/20 bg-indigo/10 text-indigo-light hover:bg-indigo/20"
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

            <QuizActions folderId={folderId} total={cards.length} newCount={newCount} dueCount={dueCount} />

            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 ${editing
                  ? "border border-rose/20 bg-rose/10 text-rose hover:bg-rose/20"
                  : "border border-indigo/20 bg-indigo/10 text-indigo-light hover:bg-indigo/20"
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

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowCardForm((v) => !v)}
                className="w-full cursor-pointer rounded-xl border-2 border-indigo/20 bg-indigo/5 px-5 py-3 text-sm font-bold text-indigo-light shadow-sm transition-all duration-300 hover:border-indigo hover:bg-indigo hover:text-white hover:shadow-lg"
              >
                {showCardForm ? "✕ Đóng Form" : "＋ Thêm Thẻ Mới"}
              </button>
              <BulkImport onImport={handleImport} />
            </div>
          </div>
        </aside>

        {/* ═══════ DANH SÁCH THẺ ═══════ */}
        <main className="min-w-0 flex-1">
          {showCardForm && <AddCardForm onSubmit={handleCreate} />}

          <CardsHeader count={cards.length} />

          {cards.length === 0 ? (
            <EmptyCards />
          ) : (
            <VocabGrid
              cards={cards}
              now={now}
              onPlay={playAudio}
              onDelete={handleDelete}
              selecting={selecting}
              selectedIds={selectedIds}
              toggleSelect={toggleSelect}
            />
          )}
        </main>
      </div>
    </div>
  );
}
