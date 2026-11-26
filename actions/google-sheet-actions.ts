"use server";

import { db } from "@/lib/db";
import { cards, folders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { toCardListItem, type CardListItem } from "@/lib/card-utils";

export interface SyncStats {
  totalRows: number;
  added: number;
  updated: number;
  unchanged: number;
  skipped: number;
}

export interface SyncResult {
  success: boolean;
  stats?: SyncStats;
  lastSyncedAt?: string;
  error?: string;
  sheetUrl?: string;
  updatedCards?: CardListItem[];
}

/** Chuyển đổi link Google Sheet thành link xuất bản CSV */
function getGoogleSheetCsvUrl(sheetUrl: string): string | null {
  const trimmed = sheetUrl.trim();
  if (!trimmed) return null;

  // Dạng link xuất bản web (publish to web): .../pubhtml hoặc .../pub
  if (trimmed.includes("/pubhtml") || trimmed.includes("/pub?")) {
    return trimmed.replace(/\/pubhtml.*$/, "/pub?output=csv").replace(/\/pub\?.*$/, "/pub?output=csv");
  }

  // Dạng link chia sẻ bình thường: https://docs.google.com/spreadsheets/d/{ID}/edit...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;

  const docId = match[1];

  // Tìm gid nếu có (trang tính cụ thể)
  let gid = "0";
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  return `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
}

/** Tách câu ví dụ và bản dịch nghĩa của ví dụ nếu có dạng "Câu ví dụ (Bản dịch)" */
function extractExampleAndMeaning(example: string, explicitMeaning?: string): { sentence: string; meaning?: string } {
  const sentence = example.trim();
  const direct = explicitMeaning?.trim();
  if (direct) {
    return { sentence, meaning: direct };
  }
  if (!sentence) {
    return { sentence: "", meaning: undefined };
  }
  const bracketMatch = sentence.match(/^([\s\S]*?)\s*[(（]([\s\S]+?)[)）]\s*$/);
  if (bracketMatch) {
    return { sentence: bracketMatch[1].trim(), meaning: bracketMatch[2].trim() };
  }
  const lines = sentence.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    return { sentence: lines[0], meaning: lines.slice(1).join(" ") };
  }
  return { sentence, meaning: undefined };
}

/**
 * Đồng bộ từ vựng từ Google Sheet vào Thư mục
 * - Đối chiếu theo cột ID: Nếu ID đã tồn tại trong thư mục → CẬP NHẬT thông tin (giữ nguyên tiến độ học).
 * - Nếu không có ID nhưng Từ vựng + Kanji trùng với thẻ đã có → CẬP NHẬT.
 * - Nếu là từ mới → THÊM MỚI.
 */
export async function syncFolderWithGoogleSheet(
  folderId: number,
  sheetUrlInput?: string
): Promise<SyncResult> {
  try {
    // 1. Lấy thông tin thư mục
    const folderRows = await db.select().from(folders).where(eq(folders.id, folderId));
    const folder = folderRows[0];
    if (!folder) {
      return { success: false, error: "Không tìm thấy thư mục!" };
    }

    const effectiveUrl = (sheetUrlInput ?? folder.googleSheetUrl ?? "").trim();
    if (!effectiveUrl) {
      return {
        success: false,
        error: "Chưa có liên kết Google Sheet. Vui lòng dán link Google Sheet của bạn.",
      };
    }

    const csvUrl = getGoogleSheetCsvUrl(effectiveUrl);
    if (!csvUrl) {
      return {
        success: false,
        error: "Đường dẫn Google Sheet không hợp lệ. Hãy kiểm tra lại link bảng tính.",
      };
    }

    // 2. Tải dữ liệu CSV từ Google Sheets
    const res = await fetch(csvUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 403 || res.status === 401) {
        return {
          success: false,
          error:
            "Không thể truy cập Google Sheet. Vui lòng mở quyền 'Bất kỳ ai có đường liên kết đều có thể xem' (Anyone with the link can view) trên file Google Sheet của bạn.",
        };
      }
      return {
        success: false,
        error: `Google Sheets trả về mã lỗi HTTP ${res.status}. Vui lòng kiểm tra lại quyền truy cập link.`,
      };
    }

    const arrayBuffer = await res.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, error: "File Google Sheet không có trang tính nào hợp lệ." };
    }

    const rawRows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
    });

    if (!rawRows || rawRows.length === 0) {
      return { success: false, error: "Google Sheet đang trống, không có dữ liệu." };
    }

    // 3. Phân tích Header & Thứ tự cột
    // Cấu trúc chuẩn người dùng:
    // ID | Từ vựng (Kana) | Kanji | Furigana | Romaji | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ | Có dịch nghĩa | Hình ảnh
    let headerMap: {
      id?: number;
      word?: number;
      kanji?: number;
      furigana?: number;
      romaji?: number;
      pos?: number;
      translation?: number;
      definition?: number;
      example?: number;
      exampleMeaning?: number;
      imageUrl?: number;
    } | null = null;

    const firstRow = rawRows[0].map((c) => String(c ?? "").trim());
    const firstRowJoined = firstRow.join(" ").toLowerCase();

    const hasHeader =
      firstRowJoined.includes("từ vựng") ||
      firstRowJoined.includes("kana") ||
      firstRowJoined.includes("kanji") ||
      firstRowJoined.includes("nghĩa") ||
      firstRowJoined.includes("word") ||
      firstRowJoined.includes("meaning") ||
      firstRowJoined.includes("translation") ||
      firstRowJoined.includes("単語") ||
      firstRowJoined.includes("意味");

    if (hasHeader) {
      headerMap = {};
      firstRow.forEach((col, idx) => {
        const c = col.toLowerCase();
        if (c === "id" || c === "mã" || c === "stt") {
          headerMap!.id = idx;
        } else if (c.includes("dịch nghĩa ví dụ") || c.includes("có dịch nghĩa") || c.includes("dịch ví dụ") || c.includes("nghĩa ví dụ") || c.includes("例文訳")) {
          headerMap!.exampleMeaning = idx;
        } else if (c.includes("ví dụ") || c.includes("example") || c.includes("例文")) {
          headerMap!.example = idx;
        } else if (c.includes("ngữ cảnh") || c.includes("sắc thái") || c.includes("định nghĩa") || c.includes("definition") || c.includes("context") || c.includes("文脈")) {
          headerMap!.definition = idx;
        } else if (c.includes("loại từ") || c.includes("từ loại") || c.includes("pos") || c.includes("part of speech") || c.includes("品詞")) {
          headerMap!.pos = idx;
        } else if (c.includes("nghĩa") || c.includes("translation") || c.includes("meaning") || c.includes("意味")) {
          headerMap!.translation = idx;
        } else if (c.includes("furigana") || c.includes("cách đọc") || c.includes("ふりがな")) {
          headerMap!.furigana = idx;
        } else if (c.includes("romaji") || c.includes("rōmaji") || c.includes("ローマ字")) {
          headerMap!.romaji = idx;
        } else if (c.includes("kanji") || c.includes("chữ hán") || c.includes("hán tự") || c.includes("漢字")) {
          headerMap!.kanji = idx;
        } else if (c.includes("hình ảnh") || c.includes("ảnh") || c.includes("link ảnh") || c.includes("image") || c.includes("画像")) {
          headerMap!.imageUrl = idx;
        } else if (c.includes("từ vựng") || c.includes("kana") || c.includes("word") || c.includes("単語") || c.includes("かな")) {
          headerMap!.word = idx;
        }
      });
    }

    const startRowIndex = hasHeader ? 1 : 0;

    // 4. Lấy toàn bộ thẻ hiện có trong thư mục này để đối chiếu
    const existingCards = await db.select().from(cards).where(eq(cards.folderId, folderId));
    const cardByIdMap = new Map(existingCards.map((c) => [c.id, c]));
    const cardByWordKeyMap = new Map(
      existingCards.map((c) => [`${c.word.trim().toLowerCase()}|${(c.kanji ?? "").trim().toLowerCase()}`, c])
    );

    let added = 0;
    let updated = 0;
    let unchanged = 0;
    let skipped = 0;

    for (let r = startRowIndex; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0) continue;

      let idVal: number | null = null;
      let word = "";
      let kanji = "";
      let furigana = "";
      let romaji = "";
      let partOfSpeech = "";
      let translation = "";
      let definition = "";
      let rawExample = "";
      let explicitMeaning = "";
      let imageUrl = "";

      if (headerMap) {
        if (headerMap.id !== undefined && row[headerMap.id]) {
          const parsedId = Number.parseInt(String(row[headerMap.id]).trim(), 10);
          if (Number.isInteger(parsedId) && parsedId > 0) idVal = parsedId;
        }
        if (headerMap.word !== undefined) word = String(row[headerMap.word] ?? "").trim();
        if (headerMap.kanji !== undefined) kanji = String(row[headerMap.kanji] ?? "").trim();
        if (headerMap.furigana !== undefined) furigana = String(row[headerMap.furigana] ?? "").trim();
        if (headerMap.romaji !== undefined) romaji = String(row[headerMap.romaji] ?? "").trim();
        if (headerMap.pos !== undefined) partOfSpeech = String(row[headerMap.pos] ?? "").trim();
        if (headerMap.translation !== undefined) translation = String(row[headerMap.translation] ?? "").trim();
        if (headerMap.definition !== undefined) definition = String(row[headerMap.definition] ?? "").trim();
        if (headerMap.example !== undefined) rawExample = String(row[headerMap.example] ?? "").trim();
        if (headerMap.exampleMeaning !== undefined) explicitMeaning = String(row[headerMap.exampleMeaning] ?? "").trim();
        if (headerMap.imageUrl !== undefined) imageUrl = String(row[headerMap.imageUrl] ?? "").trim();
      } else {
        // Fallback theo vị trí nếu không có dòng tiêu đề:
        // Cấu trúc 11 cột: ID (0) | Từ vựng (1) | Kanji (2) | Furigana (3) | Romaji (4) | Loại từ (5) | Nghĩa (6) | Ngữ cảnh (7) | Ví dụ (8) | Có dịch nghĩa (9) | Hình ảnh (10)
        if (row.length >= 11) {
          const parsedId = Number.parseInt(String(row[0] ?? "").trim(), 10);
          if (Number.isInteger(parsedId) && parsedId > 0) idVal = parsedId;
          word = String(row[1] ?? "").trim();
          kanji = String(row[2] ?? "").trim();
          furigana = String(row[3] ?? "").trim();
          romaji = String(row[4] ?? "").trim();
          partOfSpeech = String(row[5] ?? "").trim();
          translation = String(row[6] ?? "").trim();
          definition = String(row[7] ?? "").trim();
          rawExample = String(row[8] ?? "").trim();
          explicitMeaning = String(row[9] ?? "").trim();
          imageUrl = String(row[10] ?? "").trim();
        } else if (row.length === 10) {
          // 10 cột (không có ID): Từ vựng (0) | Kanji (1) | Furigana (2) | Romaji (3) | Loại từ (4) | Nghĩa (5) | Ngữ cảnh (6) | Ví dụ (7) | Có dịch nghĩa (8) | Hình ảnh (9)
          word = String(row[0] ?? "").trim();
          kanji = String(row[1] ?? "").trim();
          furigana = String(row[2] ?? "").trim();
          romaji = String(row[3] ?? "").trim();
          partOfSpeech = String(row[4] ?? "").trim();
          translation = String(row[5] ?? "").trim();
          definition = String(row[6] ?? "").trim();
          rawExample = String(row[7] ?? "").trim();
          explicitMeaning = String(row[8] ?? "").trim();
          imageUrl = String(row[9] ?? "").trim();
        } else {
          word = String(row[0] ?? "").trim();
          translation = String(row[1] ?? "").trim();
        }
      }

      if (!word || !translation) {
        skipped++;
        continue;
      }

      const { sentence: finalExample, meaning: autoMeaning } = extractExampleAndMeaning(
        rawExample,
        explicitMeaning
      );

      // 5. Kiểm tra đối chiếu thẻ:
      // Ưu tiên 1: Tìm theo ID
      let matchedCard = idVal ? cardByIdMap.get(idVal) : undefined;
      // Ưu tiên 2: Nếu không có ID, tìm theo cặp Từ vựng + Kanji
      if (!matchedCard) {
        matchedCard = cardByWordKeyMap.get(`${word.toLowerCase()}|${kanji.toLowerCase()}`);
      }

      if (matchedCard) {
        // Kiểm tra xem nội dung có thay đổi so với DB không
        const isDiff =
          matchedCard.word !== word ||
          (matchedCard.kanji ?? "") !== kanji ||
          (matchedCard.furigana ?? "") !== furigana ||
          (matchedCard.romaji ?? "") !== romaji ||
          (matchedCard.partOfSpeech ?? "") !== partOfSpeech ||
          matchedCard.translation !== translation ||
          (matchedCard.definition ?? "") !== definition ||
          (matchedCard.example ?? "") !== finalExample ||
          (matchedCard.exampleMeaning ?? "") !== (autoMeaning ?? "") ||
          (matchedCard.imageUrl ?? "") !== imageUrl;

        if (isDiff) {
          await db
            .update(cards)
            .set({
              word,
              kanji: kanji || null,
              furigana: furigana || null,
              romaji: romaji || null,
              partOfSpeech: partOfSpeech || null,
              translation,
              definition: definition || null,
              example: finalExample || null,
              exampleMeaning: autoMeaning || null,
              imageUrl: imageUrl || null,
            })
            .where(eq(cards.id, matchedCard.id));
          updated++;
        } else {
          unchanged++;
        }
      } else {
        // Thêm mới
        await db.insert(cards).values({
          folderId,
          word,
          kanji: kanji || null,
          furigana: furigana || null,
          romaji: romaji || null,
          partOfSpeech: partOfSpeech || null,
          translation,
          definition: definition || null,
          example: finalExample || null,
          exampleMeaning: autoMeaning || null,
          imageUrl: imageUrl || null,
        });
        added++;
      }
    }

    // 6. Cập nhật thời điểm đồng bộ & link Sheet cho thư mục
    const now = new Date();
    await db
      .update(folders)
      .set({
        googleSheetUrl: effectiveUrl,
        lastSyncedAt: now,
      })
      .where(eq(folders.id, folderId));

    revalidatePath(`/folders/${folderId}`);
    revalidatePath("/folders");

    // Lấy lại danh sách thẻ mới nhất để giao diện update lập tức
    const freshCards = await db.select().from(cards).where(eq(cards.folderId, folderId));

    return {
      success: true,
      stats: {
        totalRows: rawRows.length - startRowIndex,
        added,
        updated,
        unchanged,
        skipped,
      },
      lastSyncedAt: now.toISOString(),
      sheetUrl: effectiveUrl,
      updatedCards: freshCards.map(toCardListItem),
    };
  } catch (err) {
    console.error("Lỗi khi đồng bộ Google Sheet:", err);
    return {
      success: false,
      error: `Lỗi khi đồng bộ: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Xuất file CSV 11 cột có sẵn ID của toàn bộ thẻ trong thư mục
 * để người dùng dán hoặc import thẳng vào Google Sheet
 */
export async function exportFolderCardsToCsv(folderId: number): Promise<string> {
  const cardList = await db.select().from(cards).where(eq(cards.folderId, folderId));

  const headers = [
    "ID",
    "Từ vựng (Kana)",
    "Kanji",
    "Furigana",
    "Romaji",
    "Loại từ",
    "Nghĩa",
    "Ngữ cảnh",
    "Ví dụ",
    "Có dịch nghĩa",
    "Hình ảnh",
  ];

  const rows = cardList.map((c) => [
    c.id,
    c.word,
    c.kanji ?? "",
    c.furigana ?? "",
    c.romaji ?? "",
    c.partOfSpeech ?? "",
    c.translation,
    c.definition ?? "",
    c.example ?? "",
    c.exampleMeaning ?? "",
    c.imageUrl ?? "",
  ]);

  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  return XLSX.utils.sheet_to_csv(ws);
}
