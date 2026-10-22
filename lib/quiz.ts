import type { Card } from "@/db/schema";
import { shuffleArray } from "@/lib/shuffle";
import { MAX_GROWTH_LEVEL } from "@/lib/growth";

// ─── Types ───────────────────────────────────────────────────────
export type Phase = "select-mode" | "learn" | "review" | "results";

export type LevelType =
  | "flashcard" // 0→1
  | "abcd-en-vn" // 1→2
  | "audio-select" // 2→3
  | "abcd-vn-en" // 3→4
  | "typing" // 4→5
  | "sentence"; // 5→6

export type Feedback = "correct" | "incorrect" | null;

export interface SessionWord {
  card: Card;
  sessionLevel: number;
}

export interface QuizItem {
  /** Định danh duy nhất của câu hỏi — dùng làm React key để reset state của ô nhập. */
  uid: number;
  word: SessionWord;
  levelType: LevelType;
  options?: string[];
}

/** An toàn cả khi giá trị đi qua ranh giới server→client dưới dạng chuỗi. */
const ts = (d: Date | string) => new Date(d).getTime();

export const NEW_BATCH_SIZE = 5;
export const REVIEW_BATCH_SIZE = 15;

export const LEVEL_LABELS: Record<LevelType, { icon: string; text: string; color: string }> = {
  flashcard: { icon: "📖", text: "Giới thiệu từ mới", color: "bg-emerald/10 border-emerald/30 text-emerald" },
  "abcd-en-vn": { icon: "🅰️", text: "Anh → Việt", color: "bg-gold/10 border-gold/30 text-gold" },
  "audio-select": { icon: "🔊", text: "Nghe chọn từ", color: "bg-indigo/10 border-indigo/30 text-indigo-light" },
  "abcd-vn-en": { icon: "🅰️", text: "Việt → Anh", color: "bg-sakura/10 border-sakura/30 text-sakura-light" },
  typing: { icon: "⌨️", text: "Gõ chính xác", color: "bg-violet-500/10 border-violet-500/30 text-violet-400" },
  sentence: { icon: "📝", text: "Viết câu", color: "bg-rose/10 border-rose/30 text-rose" },
};

// ─── Level → dạng câu hỏi ────────────────────────────────────────
export function getLevelType(level: number): LevelType {
  switch (level) {
    case 0:
      return "flashcard";
    case 1:
      return "abcd-en-vn";
    case 2:
      return "audio-select";
    case 3:
      return "abcd-vn-en";
    case 4:
      return "typing";
    default:
      return "sentence";
  }
}

// ─── Chọn thẻ cho phiên (tính cục bộ từ danh sách đã tải → bắt đầu tức thì) ──
export function countNew(cards: Card[]): number {
  let n = 0;
  for (const c of cards) if (c.growthLevel < MAX_GROWTH_LEVEL) n++;
  return Math.min(n, NEW_BATCH_SIZE);
}

export function countDue(cards: Card[], now: number): number {
  let n = 0;
  for (const c of cards) if (c.growthLevel === MAX_GROWTH_LEVEL && ts(c.nextReview) <= now) n++;
  return Math.min(n, REVIEW_BATCH_SIZE);
}

/** Thẻ chưa nở hoa, cũ nhất trước (khớp getNewCards ở server). */
export function pickNewCards(cards: Card[], limit = NEW_BATCH_SIZE): Card[] {
  return cards
    .filter((c) => c.growthLevel < MAX_GROWTH_LEVEL)
    .sort((a, b) => ts(a.createdAt) - ts(b.createdAt))
    .slice(0, limit);
}

/** Thẻ đã nở hoa và đến hạn ôn, hạn sớm nhất trước (khớp getReviewCards ở server). */
export function pickDueCards(cards: Card[], now: number, limit = REVIEW_BATCH_SIZE): Card[] {
  return cards
    .filter((c) => c.growthLevel === MAX_GROWTH_LEVEL && ts(c.nextReview) <= now)
    .sort((a, b) => ts(a.nextReview) - ts(b.nextReview))
    .slice(0, limit);
}

// ─── Sinh đáp án nhiễu ───────────────────────────────────────────
function buildOptions(card: Card, pool: Card[], field: "translation" | "word"): string[] {
  const correct = card[field];
  const distractors = shuffleArray(pool.filter((c) => c.id !== card.id && c[field] !== correct))
    .slice(0, 3)
    .map((c) => c[field]);
  return shuffleArray([correct, ...distractors]);
}

function withOptions(card: Card, levelType: LevelType, pool: Card[]): string[] | undefined {
  if (levelType === "abcd-en-vn") return buildOptions(card, pool, "translation");
  if (levelType === "abcd-vn-en" || levelType === "audio-select") return buildOptions(card, pool, "word");
  return undefined;
}

// ─── Câu hỏi chế độ HỌC: luôn ưu tiên từ có level thấp nhất ──────
export function buildLearnQuestion(batch: SessionWord[], pool: Card[], uid: number): QuizItem | null {
  const active = batch.filter((w) => w.sessionLevel < MAX_GROWTH_LEVEL);
  if (active.length === 0) return null;

  const lowest = Math.min(...active.map((w) => w.sessionLevel));
  const candidates = active.filter((w) => w.sessionLevel === lowest);
  const word = candidates[Math.floor(Math.random() * candidates.length)];
  const levelType = getLevelType(word.sessionLevel);

  return { uid, word, levelType, options: withOptions(word.card, levelType, pool) };
}

// ─── Câu hỏi chế độ ÔN TẬP: ngẫu nhiên giữa ABCD / gõ từ / viết câu ──
export function buildReviewItem(card: Card, pool: Card[], uid: number): QuizItem {
  const word: SessionWord = { card, sessionLevel: MAX_GROWTH_LEVEL };
  const r = Math.random();
  const levelType: LevelType = r < 0.33 ? "abcd-en-vn" : r < 0.66 ? "typing" : "sentence";
  return { uid, word, levelType, options: withOptions(card, levelType, pool) };
}

// ─── Chấm điểm ───────────────────────────────────────────────────
function normalizeLoose(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .replace(/[.,?!-]/g, "") // bỏ dấu câu
    .trim()
    .replace(/\s+/g, " ");
}

export function checkAnswerMatch(input: string, target: string): boolean {
  if (!input || !target) return false;
  const a = normalizeLoose(input);
  const b = normalizeLoose(target);
  if (a === b) return true;
  if (b.includes(a) && a.length >= Math.max(2, b.length * 0.5)) return true;
  if (a.includes(b) && b.length >= Math.max(2, a.length * 0.5)) return true;
  return false;
}

/** Đáp án đúng của câu ABCD / nghe chọn từ. */
export function getChoiceAnswer(item: QuizItem): string {
  return item.levelType === "abcd-en-vn" ? item.word.card.translation : item.word.card.word;
}

export function isTypingCorrect(card: Card, input: string): boolean {
  // Chấp nhận gõ đúng từ tiếng Anh HOẶC sát nghĩa tiếng Việt
  return checkAnswerMatch(input, card.word) || checkAnswerMatch(input, card.translation);
}

export function isSentenceCorrect(card: Card, input: string): boolean {
  const normalize = (t: string) => t.toLowerCase().replace(/[.,?!-]/g, "").trim().replace(/\s+/g, " ");
  const target = normalize(card.word);
  return target.length > 0 && normalize(input).includes(target);
}
