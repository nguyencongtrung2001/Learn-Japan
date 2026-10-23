"use server";

import { db } from "@/lib/db";
import { noteColumns, noteCards, type NoteColumnDB, type NoteCardDB } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import {
  DEFAULT_BOARD_DATA,
  type NotesBoardData,
  type NoteCard,
  type NoteColumn,
  type NoteLabelColor,
  type NoteChecklistItem,
} from "@/lib/notes-types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ─── 1. Get entire notes board (with auto-seed if empty) ───────────
export async function getNotesBoardAction(): Promise<{
  success: boolean;
  data?: NotesBoardData;
  error?: string;
}> {
  try {
    if (!process.env.DATABASE_URL) {
      return { success: false, error: "Thiếu biến môi trường DATABASE_URL!" };
    }

    // Lấy tất cả cột theo thứ tự
    const cols = await db
      .select()
      .from(noteColumns)
      .orderBy(asc(noteColumns.order), asc(noteColumns.createdAt));

    // Nếu database chưa có cột nào (lần đầu khởi chạy) -> tự động seed dữ liệu mẫu vào DB
    if (cols.length === 0) {
      console.log("Seeding default Trello notes into Database...");
      for (let i = 0; i < DEFAULT_BOARD_DATA.columns.length; i++) {
        const colDef = DEFAULT_BOARD_DATA.columns[i];
        await db.insert(noteColumns).values({
          id: colDef.id,
          title: colDef.title,
          order: i,
          createdAt: new Date(),
        });

        for (let j = 0; j < colDef.cards.length; j++) {
          const cardDef = colDef.cards[j];
          await db.insert(noteCards).values({
            id: cardDef.id,
            columnId: colDef.id,
            title: cardDef.title,
            description: cardDef.description || null,
            color: cardDef.color || "blue",
            checklist: cardDef.checklist || [],
            order: j,
            createdAt: new Date(cardDef.createdAt || Date.now()),
            updatedAt: new Date(),
          });
        }
      }
      return { success: true, data: DEFAULT_BOARD_DATA };
    }

    // Lấy tất cả các thẻ ghi chú
    const allCards = await db
      .select()
      .from(noteCards)
      .orderBy(asc(noteCards.order), desc(noteCards.createdAt));

    // Nhóm thẻ theo từng cột
    const columns: NoteColumn[] = cols.map((col) => {
      const cardsInCol: NoteCard[] = allCards
        .filter((c) => c.columnId === col.id)
        .map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description || undefined,
          color: (c.color as NoteLabelColor) || "blue",
          checklist: (c.checklist as NoteChecklistItem[]) || [],
          createdAt: c.createdAt ? c.createdAt.getTime() : Date.now(),
        }));

      return {
        id: col.id,
        title: col.title,
        cards: cardsInCol,
      };
    });

    return { success: true, data: { columns } };
  } catch (error) {
    console.error("Lỗi khi tải bảng ghi chú từ DB:", error);
    return { success: false, error: errorMessage(error, "Lỗi kết nối cơ sở dữ liệu") };
  }
}

// ─── 2. Create column ─────────────────────────────────────────────
export async function createNoteColumnAction(column: {
  id?: string;
  title: string;
}): Promise<{
  success: boolean;
  data?: NoteColumn;
  error?: string;
}> {
  try {
    const id = column.id || `col-${Date.now()}`;
    const title = column.title.trim();
    if (!title) {
      return { success: false, error: "Tiêu đề cột không được để trống" };
    }

    // Đếm số cột để tính order tiếp theo
    const currentCols = await db.select({ order: noteColumns.order }).from(noteColumns);
    const maxOrder = currentCols.reduce((max, c) => Math.max(max, c.order), -1);

    await db.insert(noteColumns).values({
      id,
      title,
      order: maxOrder + 1,
      createdAt: new Date(),
    });

    return {
      success: true,
      data: {
        id,
        title,
        cards: [],
      },
    };
  } catch (error) {
    console.error("Lỗi khi tạo cột mới:", error);
    return { success: false, error: errorMessage(error, "Lỗi khi lưu cột mới vào DB") };
  }
}

// ─── 3. Update column title ───────────────────────────────────────
export async function updateNoteColumnAction(
  columnId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(noteColumns)
      .set({ title: title.trim() })
      .where(eq(noteColumns.id, columnId));

    return { success: true };
  } catch (error) {
    console.error("Lỗi khi sửa cột:", error);
    return { success: false, error: errorMessage(error, "Lỗi khi cập nhật cột trong DB") };
  }
}

// ─── 4. Delete column ─────────────────────────────────────────────
export async function deleteNoteColumnAction(
  columnId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Foreign key ON DELETE CASCADE sẽ tự động xóa tất cả note_cards thuộc cột này
    await db.delete(noteColumns).where(eq(noteColumns.id, columnId));
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi xóa cột:", error);
    return { success: false, error: errorMessage(error, "Lỗi khi xóa cột trong DB") };
  }
}

// ─── 5. Create card ───────────────────────────────────────────────
export async function createNoteCardAction(
  columnId: string,
  card: {
    id?: string;
    title: string;
    description?: string;
    color?: NoteLabelColor;
    checklist?: NoteChecklistItem[];
  }
): Promise<{
  success: boolean;
  data?: NoteCard;
  error?: string;
}> {
  try {
    const id = card.id || `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const title = card.title.trim();
    if (!title) {
      return { success: false, error: "Tiêu đề thẻ không được để trống" };
    }

    const createdTime = new Date();

    await db.insert(noteCards).values({
      id,
      columnId,
      title,
      description: card.description?.trim() || null,
      color: card.color || "blue",
      checklist: card.checklist || [],
      order: 0, // Đặt lên đầu cột
      createdAt: createdTime,
      updatedAt: createdTime,
    });

    const newCard: NoteCard = {
      id,
      title,
      description: card.description?.trim() || undefined,
      color: card.color || "blue",
      checklist: card.checklist || [],
      createdAt: createdTime.getTime(),
    };

    return { success: true, data: newCard };
  } catch (error) {
    console.error("Lỗi khi tạo thẻ ghi chú:", error);
    return { success: false, error: errorMessage(error, "Lỗi khi lưu thẻ vào DB") };
  }
}

// ─── 6. Update card ───────────────────────────────────────────────
export async function updateNoteCardAction(
  cardId: string,
  updates: {
    title?: string;
    description?: string;
    color?: NoteLabelColor;
    checklist?: NoteChecklistItem[];
    columnId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Partial<typeof noteCards.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (updates.title !== undefined) updateData.title = updates.title.trim();
    if (updates.description !== undefined) updateData.description = updates.description.trim() || null;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.checklist !== undefined) updateData.checklist = updates.checklist;
    if (updates.columnId !== undefined) updateData.columnId = updates.columnId;

    await db.update(noteCards).set(updateData).where(eq(noteCards.id, cardId));
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi cập nhật thẻ ghi chú:", error);
    return { success: false, error: errorMessage(error, "Lỗi khi cập nhật thẻ vào DB") };
  }
}

// ─── 7. Move card to another column ───────────────────────────────
export async function moveNoteCardAction(
  cardId: string,
  targetColumnId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(noteCards)
      .set({
        columnId: targetColumnId,
        updatedAt: new Date(),
      })
      .where(eq(noteCards.id, cardId));

    return { success: true };
  } catch (error) {
    console.error("Lỗi khi di chuyển thẻ:", error);
    return { success: false, error: errorMessage(error, "Lỗi khi di chuyển thẻ trong DB") };
  }
}

// ─── 8. Delete card ───────────────────────────────────────────────
export async function deleteNoteCardAction(
  cardId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(noteCards).where(eq(noteCards.id, cardId));
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi xóa thẻ ghi chú:", error);
    return { success: false, error: errorMessage(error, "Lỗi khi xóa thẻ trong DB") };
  }
}
