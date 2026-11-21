import type { Card } from "@/db/schema";

/** Dữ liệu nhập khi tạo thẻ (form / import nhanh). */
export interface CardInput {
  word: string;
  kanji?: string;
  furigana?: string;
  romaji?: string;
  translation: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  exampleMeaning?: string;
  phonetic?: string;
  imageUrl?: string;
}

/**
 * Phiên bản "nhẹ" của Card dùng cho danh sách thẻ:
 * chỉ gồm các trường được hiển thị → payload RSC nhỏ hơn, ngày giờ là number (JSON-safe).
 */
export type CardListItem = Pick<
  Card,
  | "id"
  | "word"
  | "kanji"
  | "furigana"
  | "romaji"
  | "translation"
  | "partOfSpeech"
  | "definition"
  | "example"
  | "exampleMeaning"
  | "phonetic"
  | "imageUrl"
  | "growthLevel"
> & { nextReviewAt: number };

export function toCardListItem(
  card: Pick<
    Card,
    | "id"
    | "word"
    | "kanji"
    | "furigana"
    | "romaji"
    | "translation"
    | "partOfSpeech"
    | "definition"
    | "example"
    | "exampleMeaning"
    | "phonetic"
    | "imageUrl"
    | "growthLevel"
  > & {
    nextReview: Date | string;
  }
): CardListItem {
  return {
    id: card.id,
    word: card.word,
    kanji: card.kanji,
    furigana: card.furigana,
    romaji: card.romaji,
    translation: card.translation,
    partOfSpeech: card.partOfSpeech,
    definition: card.definition,
    example: card.example,
    exampleMeaning: card.exampleMeaning,
    phonetic: card.phonetic,
    imageUrl: card.imageUrl,
    growthLevel: card.growthLevel,
    nextReviewAt: new Date(card.nextReview).getTime(),
  };
}

export function isCardDue(card: Pick<CardListItem, "growthLevel" | "nextReviewAt">, now: number): boolean {
  return card.growthLevel >= 6 && card.nextReviewAt <= now;
}

/** Tách câu ví dụ và bản dịch nghĩa của ví dụ */
export function parseExampleAndMeaning(example?: string | null, exampleMeaning?: string | null) {
  const sentence = (example ?? "").trim();
  const directMeaning = (exampleMeaning ?? "").trim();
  if (directMeaning) {
    return { sentence, meaning: directMeaning };
  }
  if (!sentence) {
    return { sentence: "", meaning: "" };
  }
  // Nếu câu ví dụ có kèm dịch trong ngoặc đơn: 春になると桜が綺麗に咲きます。(Khi mùa xuân đến...)
  const bracketMatch = sentence.match(/^([\s\S]*?)\s*[(（]([\s\S]+?)[)）]\s*$/);
  if (bracketMatch) {
    return { sentence: bracketMatch[1].trim(), meaning: bracketMatch[2].trim() };
  }
  // Nếu câu ví dụ chia thành 2 dòng (dòng 1 câu gốc, dòng 2 câu dịch)
  const lines = sentence.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    return { sentence: lines[0], meaning: lines.slice(1).join(" ") };
  }
  return { sentence, meaning: "" };
}
