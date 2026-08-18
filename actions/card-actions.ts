"use server";

import { db } from "@/lib/db";
import { cards, type Card, type NewCard } from "@/db/schema";
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
export async function getCardsByFolder(folderId: string): Promise<Card[]> {
  const data = await db
    .select()
    .from(cards)
    .where(eq(cards.folderId, folderId))
    .orderBy(desc(cards.createdAt));
  return JSON.parse(JSON.stringify(data));
}

// ─── Get NEW cards (growthLevel < 6 — chưa nở hoa) ──────────────
export async function getNewCards(folderId: string, limit: number = 5): Promise<Card[]> {
  const data = await db
    .select()
    .from(cards)
    .where(and(eq(cards.folderId, folderId), lt(cards.growthLevel, 6)))
    .orderBy(cards.createdAt)
    .limit(limit);
  return JSON.parse(JSON.stringify(data));
}

// ─── Get REVIEW cards (growthLevel == 6 AND due) ─────────────────
export async function getReviewCards(folderId: string): Promise<Card[]> {
  const data = await db
    .select()
    .from(cards)
    .where(
      and(
        eq(cards.folderId, folderId),
        eq(cards.growthLevel, 6),
        lte(cards.nextReview, new Date())
      )
    );
  return JSON.parse(JSON.stringify(data));
}

// ─── Get cards due for review (SRS) — legacy compat ──────────────
export async function getDueCards(folderId: string): Promise<Card[]> {
  return getReviewCards(folderId);
}

// ─── Get card count for a folder ────────────────────────────────
export async function getCardCount(folderId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(cards)
    .where(eq(cards.folderId, folderId));
  return Number(result[0].count);
}

// ─── Get folder stats ───────────────────────────────────────────
export async function getFolderStats(folderId: string): Promise<{
  total: number;
  newCount: number;
  plantedCount: number;
  dueCount: number;
}> {
  const allCards = await getCardsByFolder(folderId);
  const now = new Date();
  return {
    total: allCards.length,
    newCount: allCards.filter(c => c.growthLevel < 6).length,
    plantedCount: allCards.filter(c => c.growthLevel === 6).length,
    dueCount: allCards.filter(c => c.growthLevel === 6 && new Date(c.nextReview) <= now).length,
  };
}

// ─── Create card ─────────────────────────────────────────────────
export async function createCard(data: {
  folderId: string;
  kanji?: string;
  kana: string;
  romaji: string;
  meaning: string;
  usage?: string;
  imageUrl?: string;
}) {
  const result = await db
    .insert(cards)
    .values({
      folderId: data.folderId,
      kanji: data.kanji || null,
      kana: data.kana,
      romaji: data.romaji,
      meaning: data.meaning,
      usage: data.usage || null,
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
  id: string,
  data: {
    kanji?: string;
    kana: string;
    romaji: string;
    meaning: string;
    usage?: string;
    imageUrl?: string;
  }
) {
  const result = await db
    .update(cards)
    .set({
      kanji: data.kanji || null,
      kana: data.kana,
      romaji: data.romaji,
      meaning: data.meaning,
      usage: data.usage || null,
      imageUrl: data.imageUrl || null,
    })
    .where(eq(cards.id, id))
    .returning();

  return JSON.parse(JSON.stringify(result[0]));
}

// ─── Delete card ─────────────────────────────────────────────────
export async function deleteCard(id: string, folderId: string) {
  await db.delete(cards).where(eq(cards.id, id));
  revalidatePath(`/folders/${folderId}`);
}

// ─── Update Growth Level (Learn mode — Planting) ─────────────────
// Khi đang học (growth < 6): đúng +1, sai -1 (min 0)
// Khi đạt level 6: set nextReview = now + 4h (bắt đầu SRS cycle)
export async function updateGrowthLevel(cardId: string, isCorrect: boolean) {
  const result = await db.select().from(cards).where(eq(cards.id, cardId));
  const card = result[0];
  if (!card) return;

  let newLevel = card.growthLevel;

  if (isCorrect) {
    newLevel = Math.min(6, newLevel + 1);
  } else {
    newLevel = Math.max(0, newLevel - 1);
  }

  const updates: Record<string, unknown> = { growthLevel: newLevel };

  // Khi vừa đạt level 6 lần đầu → bắt đầu SRS cycle
  if (newLevel === 6 && card.growthLevel < 6) {
    updates.consecutiveCorrect = 0;
    updates.nextReview = getNextReviewDate(0); // +4h
  }

  await db.update(cards).set(updates).where(eq(cards.id, cardId));
}

// ─── Update SRS (Review mode — Watering) ─────────────────────────
// Memrise Classic: đúng → consecutive++, sai → hoa héo (level=3, consecutive=0)
export async function updateSRS(cardId: string, isCorrect: boolean) {
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
