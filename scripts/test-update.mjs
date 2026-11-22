import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { updateCard } from "./actions/card-actions.ts";

async function run() {
  try {
    console.log("Calling updateCard for card 453...");
    const res = await updateCard(453, {
      word: "ドア",
      kanji: "ドア",
      furigana: "ドア",
      romaji: "doa",
      translation: "Cửa",
      folderId: 18,
    });
    console.log("updateCard result:", res);
  } catch (err) {
    console.error("updateCard error:", err);
  }
}

run();
