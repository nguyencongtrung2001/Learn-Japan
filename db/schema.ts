import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
} from "drizzle-orm/pg-core";

// ─── Folders Table ───────────────────────────────────────────────
export const folders = pgTable("folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Cards Table ─────────────────────────────────────────────────
export const cards = pgTable("cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  folderId: uuid("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),

  // ── Content ──
  kanji: text("kanji"),                // 漢字 (optional)
  kana: text("kana").notNull(),        // ひらがな / カタカナ
  romaji: text("romaji").notNull(),    // Phiên âm la-tinh
  meaning: text("meaning").notNull(),  // Nghĩa tiếng Việt
  usage: text("usage"),                // Câu ví dụ / Cách dùng
  imageUrl: text("image_url"),         // Link hình ảnh minh họa

  // ── Spaced Repetition (SM-2 Algorithm) ──
  nextReview: timestamp("next_review").defaultNow().notNull(),
  interval: integer("interval").default(0).notNull(),       // Ngày giữa 2 lần ôn
  easeFactor: real("ease_factor").default(2.5).notNull(),   // Hệ số dễ (min 1.3)
  repetitions: integer("repetitions").default(0).notNull(), // Số lần đúng liên tiếp

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Types ───────────────────────────────────────────────────────
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
