"use server";

import { db } from "@/lib/db";
import { cards, folders, type Card, type NewCard } from "@/db/schema";
import { eq, desc, lte, and, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  const data = await db
    .select()
    .from(cards)
    .where(eq(cards.folderId, folderId))
    .orderBy(desc(cards.createdAt));
  return JSON.parse(JSON.stringify(data));
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
  return JSON.parse(JSON.stringify(data));
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
  return JSON.parse(JSON.stringify(data));
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
export async function createCard(data: {
  folderId: number;
  word: string;
  translation: string;
  definition?: string;
  example?: string;
  phonetic?: string;
  imageUrl?: string;
}) {
  const result = await db
    .insert(cards)
    .values({
      folderId: data.folderId,
      word: data.word,
      translation: data.translation,
      definition: data.definition || null,
      example: data.example || null,
      phonetic: data.phonetic || null,
      imageUrl: data.imageUrl || null,
      growthLevel: 0,
      consecutiveCorrect: 0,
      nextReview: new Date(),
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
    })
    .returning();

  revalidatePath(`/folders/${data.folderId}`);
  return JSON.parse(JSON.stringify(result[0]));
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

  return JSON.parse(JSON.stringify(result[0]));
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
