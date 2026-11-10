import type { Card } from "@/db/schema";

/** Dữ liệu nhập khi tạo thẻ (form / import nhanh). */
export interface CardInput {
  word: string;
  kanji?: string;
  translation: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  phonetic?: string;
  imageUrl?: string;
}

/**
 * Phiên bản "nhẹ" của Card dùng cho danh sách thẻ:
 * chỉ gồm các trường được hiển thị → payload RSC nhỏ hơn, ngày giờ là number (JSON-safe).
 */
export type CardListItem = Pick<
  Card,
  "id" | "word" | "kanji" | "translation" | "partOfSpeech" | "definition" | "example" | "phonetic" | "imageUrl" | "growthLevel"
> & { nextReviewAt: number };

export function toCardListItem(
  card: Pick<Card, "id" | "word" | "kanji" | "translation" | "partOfSpeech" | "definition" | "example" | "phonetic" | "imageUrl" | "growthLevel"> & {
    nextReview: Date | string;
  }
): CardListItem {
  return {
    id: card.id,
    word: card.word,
    kanji: card.kanji,
    translation: card.translation,
    partOfSpeech: card.partOfSpeech,
    definition: card.definition,
    example: card.example,
    phonetic: card.phonetic,
    imageUrl: card.imageUrl,
    growthLevel: card.growthLevel,
    nextReviewAt: new Date(card.nextReview).getTime(),
  };
}

export function isCardDue(card: Pick<CardListItem, "growthLevel" | "nextReviewAt">, now: number): boolean {
  return card.growthLevel >= 6 && card.nextReviewAt <= now;
}
