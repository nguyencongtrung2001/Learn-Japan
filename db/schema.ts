import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  AnyPgColumn,
} from "drizzle-orm/pg-core";

// ─── Folders Table ───────────────────────────────────────────────
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  maxCards: integer("max_cards"), // optional max number of cards, null = unlimited
  language: text("language").default("english").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Cards Table ─────────────────────────────────────────────────
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  folderId: integer("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),

  // ── Content ──
  word: text("word").notNull(),
  translation: text("translation").notNull(),
  definition: text("definition"),
  example: text("example"),
  phonetic: text("phonetic"),
  imageUrl: text("image_url"),

  // ── Spaced Repetition (Memrise Classic Algorithm) ──
  growthLevel: integer("growth_level").default(0).notNull(),               // 0-6 (🌰→🌺)
  consecutiveCorrect: integer("consecutive_correct").default(0).notNull(), // Lần đúng liên tiếp khi ôn
  nextReview: timestamp("next_review").defaultNow().notNull(),
  interval: integer("interval").default(0).notNull(),       // (legacy) giữ tương thích
  easeFactor: real("ease_factor").default(2.5).notNull(),   // (legacy)
  repetitions: integer("repetitions").default(0).notNull(), // (legacy)

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Types ───────────────────────────────────────────────────────
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
