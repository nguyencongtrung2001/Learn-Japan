"use server";

import { db } from "@/lib/db";
import { folders, type Folder } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ─── Get all folders ─────────────────────────────────────────────
export async function getFolders(): Promise<{ success: boolean; data?: Folder[]; error?: string }> {
  try {
    if (!process.env.DATABASE_URL) {
      return { success: false, error: "Thiếu biến môi trường DATABASE_URL trên Vercel!" };
    }
    const data = await db.select().from(folders).orderBy(desc(folders.createdAt));
    return { success: true, data };
  } catch (error) {
    console.error("Error in getFolders:", error);
    return { success: false, error: errorMessage(error, "Lỗi kết nối Database") };
  }
}

// ─── Get single folder ──────────────────────────────────────────
export async function getFolderById(id: number): Promise<Folder | undefined> {
  const result = await db.select().from(folders).where(eq(folders.id, id));
  return result[0];
}

// ─── Create folder ──────────────────────────────────────────────
export async function createFolder(data: { name: string; description?: string; maxCards?: number }): Promise<{ success: boolean; data?: Folder; error?: string }> {
  try {
    if (!process.env.DATABASE_URL) {
      return { success: false, error: "Thiếu biến môi trường DATABASE_URL!" };
    }
    const result = await db
      .insert(folders)
      .values({
        name: data.name,
        description: data.description || null,
        maxCards: data.maxCards ?? null,
      })
      .returning();

    revalidatePath("/folders");
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Error creating folder:", error);
    return { success: false, error: errorMessage(error, "Lỗi khi tạo thư mục") };
  }
}

// ─── Update folder ──────────────────────────────────────────────
export async function updateFolder(id: number, data: { name: string; description?: string; maxCards?: number }) {
  const result = await db
    .update(folders)
    .set({
      name: data.name,
      description: data.description || null,
      maxCards: data.maxCards ?? null,
    })
    .where(eq(folders.id, id))
    .returning();

  revalidatePath("/folders");
  revalidatePath(`/folders/${id}`);
  return result[0];
}

// ─── Delete folder ──────────────────────────────────────────────
export async function deleteFolder(id: number) {
  await db.delete(folders).where(eq(folders.id, id));
  revalidatePath("/folders");
}
