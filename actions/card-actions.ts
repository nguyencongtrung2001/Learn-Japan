"use server";

import { db } from "@/lib/db";
import { cards, type Card, type NewCard } from "@/db/schema";
import { eq, desc, lte, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Get all cards in a folder ───────────────────────────────────
export async function getCardsByFolder(folderId: string): Promise<Card[]> {
  return db
    .select()
    .from(cards)
    .where(eq(cards.folderId, folderId))
    .orderBy(desc(cards.createdAt));
}

// ─── Get cards due for review (SRS) ─────────────────────────────
export async function getDueCards(folderId: string): Promise<Card[]> {
  return db
    .select()
    .from(cards)
    .where(and(eq(cards.folderId, folderId), lte(cards.nextReview, new Date())));
}

// ─── Get card count for a folder ────────────────────────────────
export async function getCardCount(folderId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(cards)
    .where(eq(cards.folderId, folderId));
  return Number(result[0].count);
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
      nextReview: new Date(),
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
    })
    .returning();

  revalidatePath(`/folders/${data.folderId}`);
  return result[0];
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

  return result[0];
}

// ─── Delete card ─────────────────────────────────────────────────
export async function deleteCard(id: string, folderId: string) {
  await db.delete(cards).where(eq(cards.id, id));
  revalidatePath(`/folders/${folderId}`);
}

// ─── SM-2 Spaced Repetition Algorithm ────────────────────────────
// quality: 0-5 (0=complete blackout, 5=perfect response)
// Simplified for our use: 0=wrong, 3=hard, 4=good, 5=easy
export async function updateSRS(cardId: string, quality: number) {
  // Fetch the current card
  const result = await db.select().from(cards).where(eq(cards.id, cardId));
  const card = result[0];
  if (!card) return;

  let { repetitions, interval, easeFactor } = card;

  if (quality < 3) {
    // Wrong answer → reset
    repetitions = 0;
    interval = 0;
  } else {
    // Correct answer
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1; // Review tomorrow
    } else if (repetitions === 2) {
      interval = 3; // Review in 3 days
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Update ease factor (SM-2 formula)
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  await db
    .update(cards)
    .set({
      repetitions,
      interval,
      easeFactor,
      nextReview,
    })
    .where(eq(cards.id, cardId));
}
