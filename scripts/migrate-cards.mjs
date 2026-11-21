import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }
  const sql = neon(process.env.DATABASE_URL);
  console.log("Connecting to Neon...");
  await sql`ALTER TABLE cards ADD COLUMN IF NOT EXISTS furigana TEXT;`;
  await sql`ALTER TABLE cards ADD COLUMN IF NOT EXISTS romaji TEXT;`;
  await sql`ALTER TABLE cards ADD COLUMN IF NOT EXISTS example_meaning TEXT;`;
  console.log("Successfully added columns to cards table!");
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cards' ORDER BY ordinal_position;`;
  console.log("Cards columns:", cols.map((c) => c.column_name));
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
