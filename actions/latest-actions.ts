"use server";

import { db } from "@/lib/db";
import { folders, cards, type Folder } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { MAX_GROWTH_LEVEL } from "@/lib/growth";
import { RECOMMENDED_SETS } from "@/data/recommended-sets";

export interface LatestPreviewCard {
  id: number;
  word: string;
  kanji: string | null;
  translation: string;
  partOfSpeech: string | null;
  growthLevel: number;
}

export interface LatestFolderItem extends Folder {
  cardCount: number;
  learnedCount: number;
  studyingCount: number;
  dueCount: number;
  previewCards: LatestPreviewCard[];
}

export interface LatestDashboardData {
  folders: LatestFolderItem[];
  stats: {
    totalSets: number;
    totalCards: number;
    totalLearned: number;
    totalDue: number;
    retentionRate: number;
    japaneseSetsCount: number;
    englishSetsCount: number;
  };
  recommendedSets: typeof RECOMMENDED_SETS;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function getLatestDashboardData(): Promise<{
  success: boolean;
  data?: LatestDashboardData;
  error?: string;
}> {
  try {
    if (!process.env.DATABASE_URL) {
      return { success: false, error: "Thiếu biến môi trường DATABASE_URL!" };
    }

    const now = new Date();

    // 1. Fetch folders with counts & due counts
    const folderRows = await db
      .select({
        id: folders.id,
        name: folders.name,
        description: folders.description,
        maxCards: folders.maxCards,
        language: folders.language,
        createdAt: folders.createdAt,
        cardCount: sql<number>`count(${cards.id})::int`,
        learnedCount: sql<number>`count(case when ${cards.growthLevel} >= 5 then 1 end)::int`,
        studyingCount: sql<number>`count(case when ${cards.growthLevel} > 0 and ${cards.growthLevel} < 5 then 1 end)::int`,
        dueCount: sql<number>`count(case when ${cards.growthLevel} >= 5 and ${cards.nextReview} <= ${now} then 1 end)::int`,
      })
      .from(folders)
      .leftJoin(cards, eq(cards.folderId, folders.id))
      .groupBy(folders.id)
      .orderBy(desc(folders.createdAt));

    // 2. Fetch preview cards for folders (up to 3 cards per folder)
    const folderIds = folderRows.map((f) => f.id);
    let previewCardsMap: Record<number, LatestPreviewCard[]> = {};

    if (folderIds.length > 0) {
      const allCards = await db
        .select({
          id: cards.id,
          folderId: cards.folderId,
          word: cards.word,
          kanji: cards.kanji,
          translation: cards.translation,
          partOfSpeech: cards.partOfSpeech,
          growthLevel: cards.growthLevel,
          createdAt: cards.createdAt,
        })
        .from(cards)
        .orderBy(desc(cards.createdAt));

      previewCardsMap = allCards.reduce((acc, card) => {
        if (!acc[card.folderId]) {
          acc[card.folderId] = [];
        }
        if (acc[card.folderId].length < 3) {
          acc[card.folderId].push({
            id: card.id,
            word: card.word,
            kanji: card.kanji,
            translation: card.translation,
            partOfSpeech: card.partOfSpeech,
            growthLevel: card.growthLevel,
          });
        }
        return acc;
      }, {} as Record<number, LatestPreviewCard[]>);
    }

    const enrichedFolders: LatestFolderItem[] = folderRows.map((f) => ({
      ...f,
      previewCards: previewCardsMap[f.id] || [],
    }));

    // 3. Global Stats calculation
    const totalSets = enrichedFolders.length;
    const totalCards = enrichedFolders.reduce((sum, f) => sum + f.cardCount, 0);
    const totalLearned = enrichedFolders.reduce((sum, f) => sum + f.learnedCount, 0);
    const totalDue = enrichedFolders.reduce((sum, f) => sum + f.dueCount, 0);

    const japaneseSetsCount = enrichedFolders.filter(
      (f) => f.language === "japanese"
    ).length;
    const englishSetsCount = enrichedFolders.filter(
      (f) => f.language === "english"
    ).length;

    // Calculate retention
    let retentionRate = 0;
    if (totalCards > 0) {
      const allPointsRes = await db
        .select({
          totalPoints: sql<number>`coalesce(sum(${cards.growthLevel}), 0)::int`,
        })
        .from(cards);
      const totalPoints = allPointsRes[0]?.totalPoints ?? 0;
      retentionRate = Math.round((totalPoints / (totalCards * MAX_GROWTH_LEVEL)) * 100);
    }

    return {
      success: true,
      data: {
        folders: enrichedFolders,
        stats: {
          totalSets,
          totalCards,
          totalLearned,
          totalDue,
          retentionRate,
          japaneseSetsCount,
          englishSetsCount,
        },
        recommendedSets: RECOMMENDED_SETS,
      },
    };
  } catch (error) {
    console.error("Error in getLatestDashboardData:", error);
    return {
      success: false,
      error: errorMessage(error, "Lỗi khi tải dữ liệu trang Gần đây"),
    };
  }
}

// ─── Import Recommended Set directly into DB ─────────────────────
export async function importRecommendedSet(
  setKey: string
): Promise<{ success: boolean; folderId?: number; error?: string }> {
  try {
    const template = RECOMMENDED_SETS.find((s) => s.key === setKey);
    if (!template) {
      return { success: false, error: "Không tìm thấy bộ thẻ mẫu này!" };
    }

    // 1. Create Folder
    const [newFolder] = await db
      .insert(folders)
      .values({
        name: template.title,
        description: template.description,
        language: template.language,
        maxCards: 100,
      })
      .returning();

    if (!newFolder) {
      return { success: false, error: "Không thể tạo thư mục mới!" };
    }

    // 2. Insert Cards in bulk
    const now = new Date();
    const cardValues = template.cards.map((c) => ({
      folderId: newFolder.id,
      word: c.word,
      kanji: c.kanji || null,
      translation: c.translation,
      partOfSpeech: c.partOfSpeech || null,
      definition: c.definition || null,
      example: c.example || null,
      phonetic: c.phonetic || null,
      imageUrl: c.imageUrl || null,
      growthLevel: 0,
      consecutiveCorrect: 0,
      nextReview: now,
    }));

    if (cardValues.length > 0) {
      await db.insert(cards).values(cardValues);
    }

    revalidatePath("/latest");
    revalidatePath("/folders");

    return { success: true, folderId: newFolder.id };
  } catch (error) {
    console.error("Error importing recommended set:", error);
    return {
      success: false,
      error: errorMessage(error, "Lỗi khi nhập bộ thẻ gợi ý"),
    };
  }
}
