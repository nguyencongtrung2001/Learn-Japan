"use server";

import { db } from "@/lib/db";
import { folders, type Folder, type NewFolder } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Get all folders ─────────────────────────────────────────────
export async function getFolders(): Promise<Folder[]> {
  return db.select().from(folders).orderBy(desc(folders.createdAt));
}

// ─── Get single folder ──────────────────────────────────────────
export async function getFolderById(id: string): Promise<Folder | undefined> {
  const result = await db.select().from(folders).where(eq(folders.id, id));
  return result[0];
}

// ─── Create folder ──────────────────────────────────────────────
export async function createFolder(data: { name: string; description?: string }) {
  const result = await db
    .insert(folders)
    .values({
      name: data.name,
      description: data.description || null,
    })
    .returning();

  revalidatePath("/folders");
  return result[0];
}

// ─── Update folder ──────────────────────────────────────────────
export async function updateFolder(id: string, data: { name: string; description?: string }) {
  const result = await db
    .update(folders)
    .set({
      name: data.name,
      description: data.description || null,
    })
    .where(eq(folders.id, id))
    .returning();

  revalidatePath("/folders");
  return result[0];
}

// ─── Delete folder ──────────────────────────────────────────────
export async function deleteFolder(id: string) {
  await db.delete(folders).where(eq(folders.id, id));
  revalidatePath("/folders");
}
