import { config } from "dotenv";
config({ path: ".env.local" });

async function dropColumn() {
  const { db } = await import("./lib/db");
  const { sql } = await import("drizzle-orm");
  await db.execute(sql`ALTER TABLE folders DROP COLUMN IF EXISTS parent_id CASCADE;`);
  console.log("Column parent_id dropped.");
}

dropColumn().then(() => {
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
