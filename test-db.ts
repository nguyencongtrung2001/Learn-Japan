import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import "dotenv/config";

async function test() {
  try {
    console.log("Connecting to", process.env.DATABASE_URL);
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);
    
    // Run a simple query
    const result = await sql`SELECT 1 as test`;
    console.log("Connection successful:", result);
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

test();
