"use client";

import { useEffect, useState, useCallback, useMemo, useTransition } from "react";
import {
  DEFAULT_BOARD_DATA,
  type NoteCard,
  type NoteColumn,
  type NotesBoardData,
  type NoteLabelColor,
} from "@/lib/notes-types";
import {
  getNotesBoardAction,
  createNoteCardAction,
  updateNoteCardAction,
  deleteNoteCardAction,
  moveNoteCardAction,
  createNoteColumnAction,
  updateNoteColumnAction,
  deleteNoteColumnAction,
} from "@/actions/notes-actions";

const STORAGE_KEY = "trello_notes_board_v1";

export function useNotesBoard() {
  const [board, setBoard] = useState<NotesBoardData>(DEFAULT_BOARD_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">("synced");
  const [, startTransition] = useTransition();

  // 1. Khởi tạo cache tức thì từ localStorage, sau đó tải dữ liệu mới nhất từ Neon Postgres DB
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.columns && Array.isArray(parsed.columns)) {
          setBoard(parsed);
        }
      }
    } catch (err) {
      console.error("Lỗi khi đọc cache localStorage:", err);
    }

    // Tải dữ liệu thật từ Database
    let isCancelled = false;
    getNotesBoardAction()
      .then((res) => {
        if (isCancelled) return;
        if (res.success && res.data && res.data.columns.length > 0) {
          setBoard(res.data);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
          } catch {}
          setSyncStatus("synced");
        } else if (res.error) {
          console.warn("Lỗi khi đọc notes từ DB, sử dụng dữ liệu cục bộ:", res.error);
        }
      })
      .catch((err) => {
        console.error("DB notes fetch failed:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Lưu vào localStorage & thông báo tới các component khác
  const persistLocal = useCallback((newBoard: NotesBoardData) => {
    setBoard(newBoard);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBoard));
      window.dispatchEvent(new Event("trello-notes-updated"));
    } catch (err) {
      console.error("Lỗi khi lưu cache:", err);
    }
  }, []);

  // Đồng bộ giữa các tab cùng trình duyệt
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setBoard(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Sync error:", e);
      }
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("trello-notes-updated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("trello-notes-updated", handleSync);
    };
  }, []);

  // ─── Thêm thẻ (Optimistic UI + Lưu DB thật) ─────────────────────
  const addCard = useCallback(
    (columnId: string, title: string, description?: string, color?: NoteLabelColor) => {
      if (!title.trim()) return;
      const cardId = `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newCard: NoteCard = {
        id: cardId,
        title: title.trim(),
        description: description?.trim() || "",
        color: color || "blue",
        checklist: [],
        createdAt: Date.now(),
      };

      const updatedColumns = board.columns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            cards: [newCard, ...col.cards],
          };
        }
        return col;
      });

      persistLocal({ columns: updatedColumns });
      setSyncStatus("saving");

      startTransition(async () => {
        try {
          const res = await createNoteCardAction(columnId, newCard);
          if (res.success) {
            setSyncStatus("synced");
          } else {
            console.error("DB create card error:", res.error);
            setSyncStatus("error");
          }
        } catch (e) {
          console.error("DB create card failed:", e);
          setSyncStatus("error");
        }
      });
    },
    [board, persistLocal]
  );

  // ─── Cập nhật thẻ (Optimistic UI + Lưu DB thật) ──────────────────
  const updateCard = useCallback(
    (cardId: string, updates: Partial<NoteCard> & { columnId?: string }) => {
      const targetColumnId = updates.columnId;

      let currentCard: NoteCard | null = null;
      for (const col of board.columns) {
        const found = col.cards.find((c) => c.id === cardId);
        if (found) {
          currentCard = found;
          break;
        }
      }

      if (!currentCard) return;

      const updatedCard: NoteCard = {
        ...currentCard,
        ...updates,
      };

      let updatedColumns: NoteColumn[];

      if (targetColumnId && targetColumnId !== board.columns.find((c) => c.cards.some((cd) => cd.id === cardId))?.id) {
        // Chuyển thẻ sang cột khác
        updatedColumns = board.columns.map((col) => {
          if (col.cards.some((c) => c.id === cardId)) {
            return {
              ...col,
              cards: col.cards.filter((c) => c.id !== cardId),
            };
          }
          if (col.id === targetColumnId) {
            return {
              ...col,
              cards: [updatedCard, ...col.cards],
            };
          }
          return col;
        });
      } else {
        // Giữ nguyên cột, cập nhật thông tin
        updatedColumns = board.columns.map((col) => {
          const idx = col.cards.findIndex((c) => c.id === cardId);
          if (idx === -1) return col;
          const newCards = [...col.cards];
          newCards[idx] = updatedCard;
          return { ...col, cards: newCards };
        });
      }

      persistLocal({ columns: updatedColumns });
      setSyncStatus("saving");

      startTransition(async () => {
        try {
          const res = await updateNoteCardAction(cardId, updates);
          if (res.success) {
            setSyncStatus("synced");
          } else {
            console.error("DB update card error:", res.error);
            setSyncStatus("error");
          }
        } catch (e) {
          console.error("DB update card failed:", e);
          setSyncStatus("error");
        }
      });
    },
    [board, persistLocal]
  );

  // ─── Xóa thẻ (Optimistic UI + Xóa trong DB thật) ────────────────
  const deleteCard = useCallback(
    (cardId: string) => {
      const updatedColumns = board.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      }));

      persistLocal({ columns: updatedColumns });
      setSyncStatus("saving");

      startTransition(async () => {
        try {
          const res = await deleteNoteCardAction(cardId);
          if (res.success) {
            setSyncStatus("synced");
          } else {
            console.error("DB delete card error:", res.error);
            setSyncStatus("error");
          }
        } catch (e) {
          console.error("DB delete card failed:", e);
          setSyncStatus("error");
        }
      });
    },
    [board, persistLocal]
  );

  // ─── Di chuyển thẻ giữa các cột (Optimistic UI + Lưu DB thật) ──
  const moveCard = useCallback(
    (cardId: string, targetColumnId: string) => {
      let targetCard: NoteCard | null = null;

      const columnsWithoutCard = board.columns.map((col) => {
        const found = col.cards.find((c) => c.id === cardId);
        if (found) targetCard = found;
        return {
          ...col,
          cards: col.cards.filter((c) => c.id !== cardId),
        };
      });

      if (!targetCard) return;

      const finalColumns = columnsWithoutCard.map((col) => {
        if (col.id === targetColumnId && targetCard) {
          return {
            ...col,
            cards: [targetCard, ...col.cards],
          };
        }
        return col;
      });

      persistLocal({ columns: finalColumns });
      setSyncStatus("saving");

      startTransition(async () => {
        try {
          const res = await moveNoteCardAction(cardId, targetColumnId);
          if (res.success) {
            setSyncStatus("synced");
          } else {
            console.error("DB move card error:", res.error);
            setSyncStatus("error");
          }
        } catch (e) {
          console.error("DB move card failed:", e);
          setSyncStatus("error");
        }
      });
    },
    [board, persistLocal]
  );

  // ─── Thêm cột (Optimistic UI + Thêm trong DB thật) ──────────────
  const addColumn = useCallback(
    (title: string) => {
      if (!title.trim()) return;
      const colId = `col-${Date.now()}`;
      const newCol: NoteColumn = {
        id: colId,
        title: title.trim(),
        cards: [],
      };

      persistLocal({ columns: [...board.columns, newCol] });
      setSyncStatus("saving");

      startTransition(async () => {
        try {
          const res = await createNoteColumnAction({ id: colId, title });
          if (res.success) {
            setSyncStatus("synced");
          } else {
            console.error("DB create column error:", res.error);
            setSyncStatus("error");
          }
        } catch (e) {
          console.error("DB create column failed:", e);
          setSyncStatus("error");
        }
      });
    },
    [board, persistLocal]
  );

  // ─── Đổi tên cột (Optimistic UI + Lưu DB thật) ─────────────────
  const updateColumn = useCallback(
    (columnId: string, title: string) => {
      if (!title.trim()) return;
      const updatedColumns = board.columns.map((col) =>
        col.id === columnId ? { ...col, title: title.trim() } : col
      );

      persistLocal({ columns: updatedColumns });
      setSyncStatus("saving");

      startTransition(async () => {
        try {
          const res = await updateNoteColumnAction(columnId, title);
          if (res.success) {
            setSyncStatus("synced");
          } else {
            console.error("DB update column error:", res.error);
            setSyncStatus("error");
          }
        } catch (e) {
          console.error("DB update column failed:", e);
          setSyncStatus("error");
        }
      });
    },
    [board, persistLocal]
  );

  // ─── Xóa cột (Optimistic UI + Xóa trong DB thật) ────────────────
  const deleteColumn = useCallback(
    (columnId: string) => {
      persistLocal({ columns: board.columns.filter((c) => c.id !== columnId) });
      setSyncStatus("saving");

      startTransition(async () => {
        try {
          const res = await deleteNoteColumnAction(columnId);
          if (res.success) {
            setSyncStatus("synced");
          } else {
            console.error("DB delete column error:", res.error);
            setSyncStatus("error");
          }
        } catch (e) {
          console.error("DB delete column failed:", e);
          setSyncStatus("error");
        }
      });
    },
    [board, persistLocal]
  );

  // Tổng số thẻ ghi chú
  const totalCardsCount = useMemo(() => {
    return board.columns.reduce((sum, col) => sum + col.cards.length, 0);
  }, [board]);

  return {
    board,
    isLoaded,
    syncStatus,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    addColumn,
    updateColumn,
    deleteColumn,
    totalCardsCount,
  };
}
