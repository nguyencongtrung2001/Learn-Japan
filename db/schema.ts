import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  index,
  jsonb,
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
export const cards = pgTable(
  "cards",
  {
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
  },
  // Postgres không tự tạo index cho FK → mọi query theo folder_id đều phải quét toàn bảng.
  (t) => [index("cards_folder_id_idx").on(t.folderId)]
);

// ─── Trello Note Columns Table ──────────────────────────────────
export const noteColumns = pgTable("note_columns", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Trello Note Cards Table ────────────────────────────────────
export const noteCards = pgTable(
  "note_cards",
  {
    id: text("id").primaryKey(),
    columnId: text("column_id")
      .notNull()
      .references(() => noteColumns.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    color: text("color").default("blue"),
    checklist: jsonb("checklist")
      .$type<{ id: string; text: string; completed: boolean }[]>()
      .default([]),
    order: integer("order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("note_cards_column_id_idx").on(t.columnId)]
);

// ─── Types ───────────────────────────────────────────────────────
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type NoteColumnDB = typeof noteColumns.$inferSelect;
export type NewNoteColumnDB = typeof noteColumns.$inferInsert;
export type NoteCardDB = typeof noteCards.$inferSelect;
export type NewNoteCardDB = typeof noteCards.$inferInsert;
