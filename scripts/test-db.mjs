import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cards';
    `;
    console.log("Columns in cards table:", cols);

    const cardsSample = await sql`
      SELECT id, word, kanji, furigana, romaji, example_meaning, folder_id 
      FROM cards 
      WHERE folder_id = 18 
      LIMIT 3;
    `;
    console.log("Cards in folder 18:", cardsSample);
  } catch (err) {
    console.error("DB Error:", err);
  }
}

run();
