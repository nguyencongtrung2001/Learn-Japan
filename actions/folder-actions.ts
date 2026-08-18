"use server";

import { db } from "@/lib/db";
import { folders, type Folder, type NewFolder } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Get all folders ─────────────────────────────────────────────
export async function getFolders(): Promise<{ success: boolean; data?: Folder[]; error?: string }> {
  try {
    if (!process.env.DATABASE_URL) {
      return { success: false, error: "Thiếu biến môi trường DATABASE_URL trên Vercel!" };
    }
    const data = await db.select().from(folders).orderBy(desc(folders.createdAt));
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error: any) {
    console.error("Error in getFolders:", error);
    return { success: false, error: error.message || "Lỗi kết nối Database" };
  }
}

// ─── Get single folder ──────────────────────────────────────────
export async function getFolderById(id: string): Promise<Folder | undefined> {
  const result = await db.select().from(folders).where(eq(folders.id, id));
  return result[0] ? JSON.parse(JSON.stringify(result[0])) : undefined;
}

// ─── Create folder ──────────────────────────────────────────────
export async function createFolder(data: { name: string; description?: string }): Promise<{ success: boolean; data?: Folder; error?: string }> {
  try {
    if (!process.env.DATABASE_URL) {
      return { success: false, error: "Thiếu biến môi trường DATABASE_URL!" };
    }
    const result = await db
      .insert(folders)
      .values({
        name: data.name,
        description: data.description || null,
      })
      .returning();

    revalidatePath("/folders");
    return { success: true, data: JSON.parse(JSON.stringify(result[0])) };
  } catch (error: any) {
    console.error("Error creating folder:", error);
    return { success: false, error: error.message || "Lỗi khi tạo thư mục" };
  }
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
  return JSON.parse(JSON.stringify(result[0]));
}

// ─── Delete folder ──────────────────────────────────────────────
export async function deleteFolder(id: string) {
  await db.delete(folders).where(eq(folders.id, id));
  revalidatePath("/folders");
}
