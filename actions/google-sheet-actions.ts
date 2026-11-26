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
  sheetName?: string;
  updatedCards?: CardListItem[];
}

/**
 * Phân tích link Google Sheet để lấy document ID, gid và trạng thái publish
 */
function parseGoogleSheetUrl(sheetUrl: string): {
  docId: string | null;
  gid: string | null;
  isPub: boolean;
  exportUrl: string | null;
} {
  const trimmed = sheetUrl.trim();
  if (!trimmed) return { docId: null, gid: null, isPub: false, exportUrl: null };

  if (trimmed.includes("/pubhtml") || trimmed.includes("/pub?")) {
    const pubCsv = trimmed
      .replace(/\/pubhtml.*$/, "/pub?output=csv")
      .replace(/\/pub\?.*$/, "/pub?output=csv");
    return { docId: null, gid: null, isPub: true, exportUrl: pubCsv };
  }

  // Khớp cả link docs.google.com/spreadsheets/d/{id} và drive.google.com/file/d/{id}
  let docId: string | null = null;
  const docMatch = trimmed.match(/\/(?:spreadsheets(?:\/u\/\d+)?|file)\/d\/([a-zA-Z0-9-_]+)/);
  if (docMatch) {
    docId = docMatch[1];
  } else {
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (idParamMatch) docId = idParamMatch[1];
  }

  let gid: string | null = null;
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  return { docId, gid, isPub: false, exportUrl: null };
}

/** Tách từ khóa để so khớp tên thư mục với tên tab trên Google Sheet */
function cleanWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/&/g, " va ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 && w !== "va");
}

/** Tìm sheet trong file có tên khớp nhất với tên thư mục */
function findBestSheetName(folderName: string, availableSheets: string[]): string {
  if (availableSheets.length === 0) return "";
  if (availableSheets.length === 1) return availableSheets[0];

  const fWords = cleanWords(folderName);
  let best = availableSheets[0];
  let maxScore = 0;

  for (const s of availableSheets) {
    const sWords = cleanWords(s);
    let score = 0;
    for (const fw of fWords) {
      if (sWords.some((sw) => sw.includes(fw) || fw.includes(sw))) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      best = s;
    }
  }

  return best;
}

/**
 * Tải dữ liệu bảng tính Google Sheet (hỗ trợ cả link thanh địa chỉ có gid và link nút chia sẻ)
 */
async function fetchGoogleSheetRows(
  effectiveUrl: string,
  folderName: string
): Promise<{ sheetName: string; rawRows: (string | number | undefined)[][] }> {
  const { docId, gid, isPub, exportUrl } = parseGoogleSheetUrl(effectiveUrl);

  // Link Publish to web
  if (isPub && exportUrl) {
    const res = await fetch(exportUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`Google Sheets trả về mã lỗi HTTP ${res.status}.`);
    const text = await res.text();
    const wb = XLSX.read(text, { type: "string" });
    const sName = wb.SheetNames[0] || "Sheet1";
    return {
      sheetName: sName,
      rawRows: XLSX.utils.sheet_to_json(wb.Sheets[sName], { header: 1, defval: "" }),
    };
  }

  if (!docId) {
    throw new Error("Đường dẫn Google Sheet không hợp lệ. Hãy kiểm tra lại liên kết.");
  }

  // 1. Nếu link có gid cụ thể (người dùng copy từ thanh địa chỉ khi chọn tab): tải trực tiếp CSV của tab đó
  if (gid) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
    try {
      const res = await fetch(csvUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const text = await res.text();
        const wb = XLSX.read(text, { type: "string" });
        const sName = wb.SheetNames[0] || "Sheet1";
        return {
          sheetName: sName,
          rawRows: XLSX.utils.sheet_to_json(wb.Sheets[sName], { header: 1, defval: "" }),
        };
      }
    } catch {
      // Nếu lỗi thì tiếp tục thử phương thức XLSX bên dưới
    }
  }

  // 2. Nếu link không có gid (ví dụ nút Chia sẻ `?usp=sharing`), hoặc CSV thất bại:
  // Tải file XLSX đa sheet và tự động khớp sheet phù hợp với tên thư mục
  const xlsxUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=xlsx`;
  try {
    const res = await fetch(xlsxUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      const wb = XLSX.read(buf, { type: "buffer" });
      const targetSheetName = findBestSheetName(folderName, wb.SheetNames);
      const sheet = wb.Sheets[targetSheetName];
      return {
        sheetName: targetSheetName,
        rawRows: XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }),
      };
    }
  } catch {
    // Nếu lỗi thì thử phương thức CSV fallback bên dưới
  }

  // 3. Fallback cuối cùng: tải CSV mặc định không có gid
  const csvFallbackUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;
  const resFallback = await fetch(csvFallbackUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    next: { revalidate: 0 },
  });

  if (!resFallback.ok) {
    if (resFallback.status === 404 || resFallback.status === 403 || resFallback.status === 401) {
      throw new Error(
        "Không thể truy cập Google Sheet. Vui lòng kiểm tra quyền: 'Bất kỳ ai có đường liên kết đều có thể xem' (Anyone with the link can view)."
      );
    }
    throw new Error(
      `Google Sheets trả về mã lỗi HTTP ${resFallback.status}. Vui lòng kiểm tra lại quyền truy cập link.`
    );
  }

  const text = await resFallback.text();
  const wb = XLSX.read(text, { type: "string" });
  const sName = wb.SheetNames[0] || "Sheet1";
  return {
    sheetName: sName,
    rawRows: XLSX.utils.sheet_to_json(wb.Sheets[sName], { header: 1, defval: "" }),
  };
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

    // 2. Tải dữ liệu bảng tính (chuẩn hóa UTF-8, hỗ trợ cả URL thanh địa chỉ & URL chia sẻ)
    const { sheetName: loadedSheetName, rawRows } = await fetchGoogleSheetRows(
      effectiveUrl,
      folder.name
    );

    if (!rawRows || rawRows.length === 0) {
      return { success: false, error: "Google Sheet đang trống, không có dữ liệu." };
    }

    // 3. Phân tích Header & Thứ tự cột
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
        } else if (
          c.includes("dịch nghĩa ví dụ") ||
          c.includes("có dịch nghĩa") ||
          c.includes("dịch ví dụ") ||
          c.includes("nghĩa ví dụ") ||
          c.includes("例文訳")
        ) {
          headerMap!.exampleMeaning = idx;
        } else if (c.includes("ví dụ") || c.includes("example") || c.includes("例文")) {
          headerMap!.example = idx;
        } else if (
          c.includes("ngữ cảnh") ||
          c.includes("sắc thái") ||
          c.includes("định nghĩa") ||
          c.includes("definition") ||
          c.includes("context") ||
          c.includes("文脈")
        ) {
          headerMap!.definition = idx;
        } else if (
          c.includes("loại từ") ||
          c.includes("từ loại") ||
          c.includes("pos") ||
          c.includes("part of speech") ||
          c.includes("品詞")
        ) {
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

      // Bỏ qua các hàng trống ở cuối trang tính
      const hasAnyData = Boolean(
        word || translation || kanji || furigana || romaji || rawExample || definition
      );
      if (!hasAnyData) {
        continue;
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
      // Ưu tiên 1: Tìm theo ID (nếu ID thuộc về thư mục này)
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
        totalRows: added + updated + unchanged + skipped,
        added,
        updated,
        unchanged,
        skipped,
      },
      lastSyncedAt: now.toISOString(),
      sheetUrl: effectiveUrl,
      sheetName: loadedSheetName,
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
