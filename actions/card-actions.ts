"use server";

import { db } from "@/lib/db";
import { cards, folders, type Card } from "@/db/schema";
import { eq, desc, lte, and, lt, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { toCardListItem, type CardInput, type CardListItem } from "@/lib/card-utils";

// ─── Memrise Classic SRS Intervals (in hours) ─────────────────────
const MEMRISE_INTERVALS_HOURS = [
  4,      // consecutive 0 → 4 giờ
  12,     // consecutive 1 → 12 giờ
  24,     // consecutive 2 → 1 ngày
  144,    // consecutive 3 → 6 ngày
  288,    // consecutive 4 → 12 ngày
  576,    // consecutive 5 → 24 ngày
  1152,   // consecutive 6 → 48 ngày
  2304,   // consecutive 7 → 96 ngày
  4320,   // consecutive 8+ → 180 ngày
];

function getNextReviewDate(consecutiveCorrect: number): Date {
  const idx = Math.min(consecutiveCorrect, MEMRISE_INTERVALS_HOURS.length - 1);
  const hours = MEMRISE_INTERVALS_HOURS[idx];
  const next = new Date();
  next.setTime(next.getTime() + hours * 60 * 60 * 1000);
  return next;
}

// ─── Get all cards in a folder ───────────────────────────────────
export async function getCardsByFolder(folderId: number): Promise<Card[]> {
  return db
    .select()
    .from(cards)
    .where(eq(cards.folderId, folderId))
    .orderBy(desc(cards.createdAt));
}

// ─── Danh sách thẻ "nhẹ" cho trang thư mục (chỉ cột cần hiển thị) ──
export async function getCardListByFolder(folderId: number): Promise<CardListItem[]> {
  const rows = await db
    .select({
      id: cards.id,
      word: cards.word,
      translation: cards.translation,
      definition: cards.definition,
      example: cards.example,
      phonetic: cards.phonetic,
      growthLevel: cards.growthLevel,
      nextReview: cards.nextReview,
    })
    .from(cards)
    .where(eq(cards.folderId, folderId))
    .orderBy(desc(cards.createdAt));
  return rows.map(toCardListItem);
}

// ─── Get NEW cards (growthLevel < 6 — chưa nở hoa) ──────────────
export async function getNewCards(folderId: number, limit: number = 5): Promise<Card[]> {
  const maxLevel = 6;

  const data = await db
    .select()
    .from(cards)
    .where(and(eq(cards.folderId, folderId), lt(cards.growthLevel, maxLevel)))
    .orderBy(cards.createdAt)
    .limit(limit);
  return data;
}

// ─── Get REVIEW cards (growthLevel == 6 AND due) ─────────────────
export async function getReviewCards(folderId: number, limit: number = 15): Promise<Card[]> {
  const maxLevel = 6;

  const data = await db
    .select()
    .from(cards)
    .where(
      and(
        eq(cards.folderId, folderId),
        eq(cards.growthLevel, maxLevel),
        lte(cards.nextReview, new Date())
      )
    )
    .orderBy(cards.nextReview)
    .limit(limit);
  return data;
}

// ─── Get cards due for review (SRS) — legacy compat ──────────────
export async function getDueCards(folderId: number): Promise<Card[]> {
  return getReviewCards(folderId);
}

// ─── Get card count for a folder ────────────────────────────────
export async function getCardCount(folderId: number): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(cards)
    .where(eq(cards.folderId, folderId));
  return Number(result[0].count);
}

// ─── Get folder stats ───────────────────────────────────────────
export async function getFolderStats(folderId: number): Promise<{
  total: number;
  newCount: number;
  plantedCount: number;
  dueCount: number;
}> {
  const maxLevel = 6;

  const allCards = await getCardsByFolder(folderId);
  const now = new Date();
  return {
    total: allCards.length,
    newCount: allCards.filter(c => c.growthLevel < maxLevel).length,
    plantedCount: allCards.filter(c => c.growthLevel === maxLevel).length,
    dueCount: allCards.filter(c => c.growthLevel === maxLevel && new Date(c.nextReview) <= now).length,
  };
}

// ─── Create card ─────────────────────────────────────────────────
function toInsertRow(folderId: number, data: CardInput) {
  return {
    folderId,
    word: data.word.trim(),
    translation: data.translation.trim(),
    definition: data.definition?.trim() || null,
    example: data.example?.trim() || null,
    phonetic: data.phonetic?.trim() || null,
    imageUrl: data.imageUrl?.trim() || null,
    // growthLevel, consecutiveCorrect, nextReview, ... dùng default của schema
  };
}

export async function createCard(data: CardInput & { folderId: number }): Promise<Card> {
  const { folderId, ...input } = data;
  const [row] = await db.insert(cards).values(toInsertRow(folderId, input)).returning();
  revalidatePath(`/folders/${folderId}`);
  return row;
}

// ─── Create nhiều thẻ trong 1 lần (import nhanh) ─────────────────
// Trước đây import gọi createCard tuần tự → N round-trip + N lần revalidate,
// và bỏ qua giới hạn maxCards. Giờ: 1 lượt kiểm tra limit + insert theo lô.
const BULK_CHUNK_SIZE = 200;

export async function createCardsBulk(
  folderId: number,
  rows: CardInput[]
): Promise<{ created: Card[]; skipped: number }> {
  const valid = rows.filter((r) => r.word?.trim() && r.translation?.trim());
  if (valid.length === 0) return { created: [], skipped: rows.length };

  const [folder] = await db
    .select({ maxCards: folders.maxCards })
    .from(folders)
    .where(eq(folders.id, folderId));
  if (!folder) return { created: [], skipped: rows.length };

  let allowed = valid;
  if (folder.maxCards) {
    const current = await getCardCount(folderId);
    allowed = valid.slice(0, Math.max(0, folder.maxCards - current));
  }
  if (allowed.length === 0) return { created: [], skipped: rows.length };

  const created: Card[] = [];
  for (let i = 0; i < allowed.length; i += BULK_CHUNK_SIZE) {
    const chunk = allowed.slice(i, i + BULK_CHUNK_SIZE).map((r) => toInsertRow(folderId, r));
    created.push(...(await db.insert(cards).values(chunk).returning()));
  }

  revalidatePath(`/folders/${folderId}`);
  return { created, skipped: rows.length - created.length };
}

// ─── Update card ─────────────────────────────────────────────────
export async function updateCard(
  id: number,
  data: {
    word?: string;
    translation?: string;
    definition?: string;
    example?: string;
    phonetic?: string;
    imageUrl?: string;
  }
) {
  const result = await db
    .update(cards)
    .set({
      word: data.word,
      translation: data.translation,
      definition: data.definition || null,
      example: data.example || null,
      phonetic: data.phonetic || null,
      imageUrl: data.imageUrl || null,
    })
    .where(eq(cards.id, id))
    .returning();

  return result[0];
}

// ─── Delete card ─────────────────────────────────────────────────
export async function deleteCard(id: number, folderId: number) {
  await db.delete(cards).where(eq(cards.id, id));
  revalidatePath(`/folders/${folderId}`);
}

// ─── Update Growth Level (Learn mode — Planting) ─────────────────
export async function updateGrowthLevel(cardId: number, isCorrect: boolean) {
  const result = await db.select().from(cards).where(eq(cards.id, cardId));
  const card = result[0];
  if (!card) return;

  const maxLevel = 6;

  let newLevel = card.growthLevel;

  if (isCorrect) {
    newLevel = Math.min(maxLevel, newLevel + 1);
  } else {
    newLevel = Math.max(0, newLevel - 1);
  }

  const updates: Record<string, unknown> = { growthLevel: newLevel };

  // Khi vừa đạt max level lần đầu → bắt đầu SRS cycle
  if (newLevel === maxLevel && card.growthLevel < maxLevel) {
    updates.consecutiveCorrect = 0;
    updates.nextReview = getNextReviewDate(0); // +4h
  }

  await db.update(cards).set(updates).where(eq(cards.id, cardId));
}

// ─── Update SRS (Review mode — Watering) ─────────────────────────
// Memrise Classic: đúng → consecutive++, sai → hoa héo (level=3, consecutive=0)
export async function updateSRS(cardId: number, isCorrect: boolean) {
  const result = await db.select().from(cards).where(eq(cards.id, cardId));
  const card = result[0];
  if (!card) return;

  if (isCorrect) {
    const newConsecutive = card.consecutiveCorrect + 1;
    await db
      .update(cards)
      .set({
        consecutiveCorrect: newConsecutive,
        nextReview: getNextReviewDate(newConsecutive),
      })
      .where(eq(cards.id, cardId));
  } else {
    // Hoa héo: growthLevel tụt về 3, consecutive reset
    await db
      .update(cards)
      .set({
        growthLevel: 3,
        consecutiveCorrect: 0,
        nextReview: getNextReviewDate(0), // +4h
      })
      .where(eq(cards.id, cardId));
  }
}

// ─── Move cards between folders ──────────────────────────────────
export async function moveCards(
  sourceFolderId: number,
  targetFolderId: number,
  cardIds: number[]
): Promise<{ success: boolean; movedIds: number[]; error?: string }> {
  if (cardIds.length === 0) return { success: false, movedIds: [], error: "Không có thẻ nào được chọn." };
  if (sourceFolderId === targetFolderId) return { success: false, movedIds: [], error: "Thư mục nguồn và đích phải khác nhau." };

  // Check target folder exists & maxCards limit
  const [targetFolder] = await db
    .select({ maxCards: folders.maxCards })
    .from(folders)
    .where(eq(folders.id, targetFolderId));
  if (!targetFolder) return { success: false, movedIds: [], error: "Thư mục đích không tồn tại." };

  if (targetFolder.maxCards) {
    const currentCount = await getCardCount(targetFolderId);
    if (currentCount + cardIds.length > targetFolder.maxCards) {
      return {
        success: false,
        movedIds: [],
        error: `Thư mục đích chỉ còn chỗ cho ${Math.max(0, targetFolder.maxCards - currentCount)} thẻ.`,
      };
    }
  }

  // Perform the move
  await db
    .update(cards)
    .set({ folderId: targetFolderId })
    .where(
      and(
        eq(cards.folderId, sourceFolderId),
        inArray(cards.id, cardIds)
      )
    );

  revalidatePath(`/folders/${sourceFolderId}`);
  revalidatePath(`/folders/${targetFolderId}`);
  revalidatePath("/folders");

  return { success: true, movedIds: cardIds };
}
