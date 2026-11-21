"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import type { CardInput } from "@/lib/card-utils";

export interface BulkImportProps {
  /** Trả về số thẻ thực sự được tạo (có thể ít hơn số dòng nếu vượt giới hạn thư mục). */
  onImport: (rows: CardInput[]) => Promise<number | void>;
  /** Callback đóng form nhập nhanh */
  onClose?: () => void;
  folderLanguage?: string;
}

// Regex nhận diện ký tự tiếng Việt (để phân biệt với Phiên âm tiếng Anh / Romaji)
const VIETNAMESE_REGEX =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

// Các ký tự IPA quốc tế điển hình
const IPA_SPECIAL_CHARS = /[əɪʌæɒɔʊθðʃʒŋˈˌː]/;

function isPhonetic(val: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (VIETNAMESE_REGEX.test(trimmed)) return false;
  // Hiragana hoặc Katakana tiếng Nhật
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) return true;
  // Bọc trong dấu gạch chéo /.../ hoặc ngoặc vuông [...]
  if (
    (trimmed.startsWith("/") && trimmed.endsWith("/") && trimmed.length >= 3) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]") && trimmed.length >= 3)
  ) {
    return true;
  }
  if (IPA_SPECIAL_CHARS.test(trimmed)) {
    return true;
  }
  return false;
}

function normalizePhonetic(val: string, isJapanese: boolean = true): string {
  const trimmed = val.trim();
  if (!trimmed) return "";
  if (
    (trimmed.startsWith("/") && trimmed.endsWith("/")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return trimmed;
  }
  if (isJapanese) {
    return trimmed;
  }
  return `/${trimmed}/`;
}

function isImageUrl(val: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("/uploads/")
  ) {
    return true;
  }
  return /\.(jpg|jpeg|png|webp|svg|gif|avif)(\?.*)?$/i.test(trimmed);
}

// Danh sách các loại từ phổ biến để tự động nhận diện thông minh
const POS_KEYWORDS = new Set([
  // Tiếng Anh & Tiếng Việt
  "noun", "n", "danh từ", "danh tu", "meishi", "名詞",
  "verb", "v", "động từ", "dong tu", "động từ nhóm 1", "động từ nhóm 2", "động từ nhóm 3", "doushi", "動詞",
  "adj", "adjective", "a", "tính từ", "tinh tu", "tính từ -i", "tính từ -na", "tính từ đuôi i", "tính từ đuôi na", "keiyoushi", "い形容詞", "な形容詞", "形容詞",
  "adv", "adverb", "trạng từ", "trang tu", "phó từ", "pho tu", "fukushi", "副詞",
  "phrase", "phr", "cụm từ", "cum tu", "rengo", "連語",
  "structure", "cấu trúc", "cau truc",
  "idiom", "thành ngữ", "thanh ngu", "kanyouku", "慣用句",
  "collocation",
  "preposition", "prep", "giới từ", "gioi tu",
  "conjunction", "conj", "liên từ", "lien tu", "setsuzokushi", "接続詞",
  "particle", "trợ từ", "tro tu", "joshi", "助詞",
  "pronoun", "pron", "đại từ", "dai tu",
  "interjection", "thán từ", "than tu", "cảm thán",
]);

function isPos(value: string): boolean {
  if (!value) return false;
  const clean = value
    .toLowerCase()
    .replace(/[()[\]{}.,;:]/g, "")
    .trim();
  if (POS_KEYWORDS.has(clean)) return true;
  if (value.length <= 16 && /^[A-ZÀ-Ỹ\s\-_/]+$/.test(value.trim())) {
    return true;
  }
  return false;
}

function normalizePos(value: string, isJapanese: boolean = true): string {
  const clean = value.replace(/[()[\]{}]/g, "").trim();
  const lower = clean.toLowerCase();

  if (!isJapanese) {
    if (lower === "n" || lower === "noun") return "NOUN";
    if (lower === "v" || lower === "verb") return "VERB";
    if (lower === "adj" || lower === "adjective") return "ADJ";
    if (lower === "adv" || lower === "adverb") return "ADV";
    if (lower === "phr" || lower === "phrase") return "PHRASE";
    if (lower === "idiom") return "IDIOM";
    if (lower === "collocation") return "COLLOCATION";
    if (lower === "prep" || lower === "preposition") return "PREP";
    if (lower === "conj" || lower === "conjunction") return "CONJ";
    if (lower === "pron" || lower === "pronoun") return "PRON";
    if (lower === "danh từ") return "Danh từ";
    if (lower === "động từ") return "Động từ";
    if (lower === "tính từ") return "Tính từ";
    if (lower === "trạng từ" || lower === "phó từ") return "Trạng từ";
    if (lower === "cụm từ") return "Cụm từ";
    if (lower === "thành ngữ") return "Thành ngữ";
    return clean.toUpperCase();
  }

  // Tiếng Nhật
  if (lower === "n" || lower === "noun" || lower === "danh từ" || lower === "meishi" || lower === "名詞") return "Danh từ";
  if (lower === "v" || lower === "verb" || lower === "động từ" || lower === "doushi" || lower === "動詞") return "Động từ";
  if (lower.includes("nhóm 1") || lower.includes("五段")) return "Động từ N1";
  if (lower.includes("nhóm 2") || lower.includes("一段")) return "Động từ N2";
  if (lower.includes("nhóm 3") || lower.includes("サ変") || lower.includes("カ変")) return "Động từ N3";
  if (lower === "adj" || lower === "adjective" || lower === "a" || lower === "tính từ" || lower === "形容詞") return "Tính từ";
  if (lower.includes("-i") || lower.includes("đuôi i") || lower.includes("い形容詞")) return "Tính từ -i";
  if (lower.includes("-na") || lower.includes("đuôi na") || lower.includes("な形容詞")) return "Tính từ -na";
  if (lower === "adv" || lower === "adverb" || lower === "trạng từ" || lower === "phó từ" || lower === "副詞") return "Phó từ";
  if (lower === "phrase" || lower === "phr" || lower === "cụm từ" || lower === "cum tu" || lower === "連語") return "Cụm từ";
  if (lower === "structure" || lower === "cấu trúc" || lower === "cau truc") return "Cấu trúc";
  if (lower === "idiom" || lower === "thành ngữ" || lower === "慣用句") return "Thành ngữ";
  if (lower === "collocation") return "Collocation";
  if (lower === "particle" || lower === "trợ từ" || lower === "助詞") return "Trợ từ";
  if (lower === "prep" || lower === "preposition" || lower === "giới từ") return "Giới từ";
  return clean;
}

/** Tách câu ví dụ và bản dịch nghĩa của ví dụ nếu có dạng "Câu ví dụ (Bản dịch)" hoặc nhiều dòng */
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
 * Xử lý dữ liệu bảng (2D array của các ô chuỗi/số) từ Excel hoặc Text
 */
function parseCardsFromRows(
  rows: (string | number | undefined)[][],
  isJapanese: boolean = true
): CardInput[] {
  if (!rows || rows.length === 0) return [];
  const result: CardInput[] = [];

  // Lọc bỏ hàng rỗng
  const cleanRows = rows
    .map((r) => r.map((cell) => String(cell ?? "").replace(/\*\*/g, "").replace(/\*/g, "").trim()))
    .filter((r) => r.some((c) => c.length > 0));

  if (cleanRows.length === 0) return [];

  // 1. Kiểm tra dòng header
  let headerMap: {
    word?: number;
    kanji?: number;
    furigana?: number;
    romaji?: number;
    phonetic?: number;
    pos?: number;
    translation?: number;
    definition?: number;
    example?: number;
    exampleMeaning?: number;
    imageUrl?: number;
  } | null = null;

  const firstLine = cleanRows[0];
  const firstLineJoined = firstLine.join(" ").toLowerCase();

  const hasWordHeader =
    firstLineJoined.includes("word") ||
    firstLineJoined.includes("từ vựng") ||
    firstLineJoined.includes("kanji") ||
    firstLineJoined.includes("kana") ||
    firstLineJoined.includes("tiếng nhật") ||
    firstLineJoined.includes("tiếng anh") ||
    firstLineJoined.includes("term") ||
    firstLineJoined.includes("vocabulary") ||
    firstLineJoined.includes("cụm từ") ||
    firstLineJoined.includes("単語") ||
    firstLineJoined.includes("かな") ||
    firstLineJoined.includes("漢字");

  const hasMeaningHeader =
    firstLineJoined.includes("translation") ||
    firstLineJoined.includes("nghĩa") ||
    firstLineJoined.includes("dịch") ||
    firstLineJoined.includes("meaning") ||
    firstLineJoined.includes("definition") ||
    firstLineJoined.includes("định nghĩa") ||
    firstLineJoined.includes("意味") ||
    firstLineJoined.includes("訳");

  if (hasWordHeader && hasMeaningHeader) {
    headerMap = {};
    firstLine.forEach((col, idx) => {
      const cLower = col.toLowerCase().trim();
      if (
        cLower.includes("ảnh") ||
        cLower.includes("hình") ||
        cLower.includes("image") ||
        cLower.includes("img") ||
        cLower.includes("pic") ||
        cLower.includes("photo") ||
        cLower.includes("画像")
      ) {
        headerMap!.imageUrl = idx;
      } else if (
        isJapanese &&
        (cLower.includes("kanji") ||
          cLower.includes("hán tự") ||
          cLower.includes("chữ hán") ||
          cLower.includes("han tu") ||
          cLower.includes("漢字"))
      ) {
        headerMap!.kanji = idx;
      } else if (
        isJapanese &&
        (cLower.includes("furigana") ||
          cLower.includes("cách đọc") ||
          cLower.includes("ふりがな") ||
          cLower.includes("振り仮名"))
      ) {
        headerMap!.furigana = idx;
      } else if (
        isJapanese &&
        (cLower.includes("romaji") ||
          cLower.includes("rōmaji") ||
          cLower.includes("phiên âm romaji") ||
          cLower.includes("ローマ字"))
      ) {
        headerMap!.romaji = idx;
      } else if (
        cLower.includes("dịch nghĩa ví dụ") ||
        cLower.includes("dịch ví dụ") ||
        cLower.includes("nghĩa ví dụ") ||
        cLower.includes("có dịch nghĩa") ||
        cLower.includes("example meaning") ||
        cLower.includes("example translation") ||
        cLower.includes("例文訳")
      ) {
        headerMap!.exampleMeaning = idx;
      } else if (
        cLower.includes("loại từ") ||
        cLower.includes("từ loại") ||
        cLower.includes("part of speech") ||
        cLower.includes("pos") ||
        cLower.includes("type") ||
        cLower.includes("品詞")
      ) {
        headerMap!.pos = idx;
      } else if (
        cLower.includes("ngữ cảnh") ||
        cLower.includes("sắc thái") ||
        cLower.includes("định nghĩa") ||
        cLower.includes("definition") ||
        cLower.includes("context") ||
        cLower.includes("explain") ||
        cLower.includes("giải thích") ||
        cLower.includes("説明") ||
        cLower.includes("文脈")
      ) {
        headerMap!.definition = idx;
      } else if (
        cLower.includes("nghĩa") ||
        cLower.includes("translation") ||
        cLower.includes("meaning") ||
        cLower.includes("dịch") ||
        cLower.includes("意味")
      ) {
        headerMap!.translation = idx;
      } else if (
        cLower.includes("phiên âm") ||
        cLower.includes("phonetic") ||
        cLower.includes("ipa") ||
        cLower.includes("phát âm") ||
        cLower.includes("発音")
      ) {
        headerMap!.phonetic = idx;
      } else if (
        cLower.includes("ví dụ") ||
        cLower.includes("example") ||
        cLower.includes("sentence") ||
        cLower.includes("câu") ||
        cLower.includes("例文")
      ) {
        headerMap!.example = idx;
      } else if (
        cLower.includes("word") ||
        cLower.includes("từ vựng") ||
        cLower.includes("kana") ||
        cLower.includes("tiếng nhật") ||
        cLower.includes("tiếng anh") ||
        cLower.includes("term") ||
        cLower.includes("vocabulary") ||
        cLower.includes("単語") ||
        cLower.includes("かな")
      ) {
        headerMap!.word = idx;
      }
    });
  }

  const startIdx = headerMap ? 1 : 0;

  for (let i = startIdx; i < cleanRows.length; i++) {
    const cols = cleanRows[i];
    // Bỏ qua dòng phân cách Markdown table: |---|---|...
    if (cols.length === 1 && cols[0].match(/^\|?[-:\s|]+\|?$/)) continue;
    if (cols.length < 2) continue;

    let word = "";
    let kanji = "";
    let furigana = "";
    let romaji = "";
    let phonetic = "";
    let partOfSpeech = "";
    let translation = "";
    let definition = "";
    let rawExample = "";
    let explicitMeaning = "";
    let imageUrl = "";

    if (headerMap && headerMap.word !== undefined) {
      word = cols[headerMap.word] || "";
      if (headerMap.kanji !== undefined && isJapanese) kanji = cols[headerMap.kanji] || "";
      if (headerMap.furigana !== undefined && isJapanese) furigana = cols[headerMap.furigana] || "";
      if (headerMap.romaji !== undefined && isJapanese) romaji = cols[headerMap.romaji] || "";
      if (headerMap.phonetic !== undefined) phonetic = cols[headerMap.phonetic] || "";
      if (headerMap.pos !== undefined) partOfSpeech = cols[headerMap.pos] || "";
      if (headerMap.translation !== undefined) translation = cols[headerMap.translation] || "";
      if (headerMap.definition !== undefined) definition = cols[headerMap.definition] || "";
      if (headerMap.example !== undefined) rawExample = cols[headerMap.example] || "";
      if (headerMap.exampleMeaning !== undefined) explicitMeaning = cols[headerMap.exampleMeaning] || "";
      if (headerMap.imageUrl !== undefined) imageUrl = cols[headerMap.imageUrl] || "";
    } else {
      // Fallback theo vị trí cột khi không có tiêu đề
      word = cols[0];

      // Tách cột ảnh nếu có ở bất kỳ đâu
      const imgIdx = cols.findIndex((c, idx) => idx > 0 && isImageUrl(c));
      let remainingCols = cols;
      if (imgIdx > 0) {
        imageUrl = cols[imgIdx];
        remainingCols = cols.filter((_, idx) => idx !== imgIdx);
      }

      if (isJapanese) {
        // Cấu trúc 10 cột tiếng Nhật đầy đủ:
        // Từ vựng (Kana) | Kanji | Furigana | Romaji | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ | Có dịch nghĩa | Link ảnh
        if (remainingCols.length >= 9) {
          kanji = remainingCols[1] || "";
          furigana = remainingCols[2] || "";
          romaji = remainingCols[3] || "";
          partOfSpeech = remainingCols[4] || "";
          translation = remainingCols[5] || "";
          definition = remainingCols[6] || "";
          rawExample = remainingCols[7] || "";
          explicitMeaning = remainingCols[8] || "";
          if (remainingCols.length >= 10 && !imageUrl && isImageUrl(remainingCols[9])) {
            imageUrl = remainingCols[9];
          }
        } else if (remainingCols.length === 8) {
          // Cấu trúc 9 cột chuẩn (đã tách ảnh ra):
          // Từ vựng (Kana) | Kanji | Furigana | Romaji | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ
          kanji = remainingCols[1] || "";
          furigana = remainingCols[2] || "";
          romaji = remainingCols[3] || "";
          partOfSpeech = remainingCols[4] || "";
          translation = remainingCols[5] || "";
          definition = remainingCols[6] || "";
          rawExample = remainingCols[7] || "";
        } else if (remainingCols.length === 7) {
          // 7 cột: Từ vựng (Kana) | Kanji | Romaji | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ
          kanji = remainingCols[1] || "";
          romaji = remainingCols[2] || "";
          partOfSpeech = remainingCols[3] || "";
          translation = remainingCols[4] || "";
          definition = remainingCols[5] || "";
          rawExample = remainingCols[6] || "";
        } else if (remainingCols.length === 6) {
          // 6 cột: Từ vựng | Kanji | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ
          kanji = remainingCols[1] || "";
          partOfSpeech = remainingCols[2] || "";
          translation = remainingCols[3] || "";
          definition = remainingCols[4] || "";
          rawExample = remainingCols[5] || "";
        } else if (remainingCols.length === 5) {
          // 5 cột: Từ vựng | Kanji | Loại từ | Nghĩa | Ví dụ
          kanji = remainingCols[1] || "";
          partOfSpeech = remainingCols[2] || "";
          translation = remainingCols[3] || "";
          rawExample = remainingCols[4] || "";
        } else if (remainingCols.length === 4) {
          // 4 cột: Từ vựng | Kanji/Phiên âm | Loại từ | Nghĩa
          if (isPos(remainingCols[2])) {
            if (isPhonetic(remainingCols[1])) {
              phonetic = remainingCols[1];
            } else {
              kanji = remainingCols[1];
            }
            partOfSpeech = remainingCols[2];
            translation = remainingCols[3];
          } else if (isPos(remainingCols[1])) {
            partOfSpeech = remainingCols[1];
            translation = remainingCols[2];
            definition = remainingCols[3];
          } else {
            kanji = remainingCols[1] || "";
            partOfSpeech = remainingCols[2] || "";
            translation = remainingCols[3] || "";
          }
        } else if (remainingCols.length === 3) {
          // 3 cột: Từ vựng | Kanji | Nghĩa (hoặc Từ vựng | Loại từ | Nghĩa)
          if (isPos(remainingCols[1])) {
            partOfSpeech = remainingCols[1];
            translation = remainingCols[2];
          } else {
            kanji = remainingCols[1] || "";
            translation = remainingCols[2] || "";
          }
        } else if (remainingCols.length === 2) {
          // 2 cột: Từ vựng | Nghĩa
          translation = remainingCols[1] || "";
        }
      } else {
        // TIẾNG ANH: Cấu trúc 7 cột:
        // Từ vựng | Phiên âm IPA | Loại từ | Nghĩa tiếng Việt | Định nghĩa tiếng Anh | Ví dụ | Link ảnh
        if (remainingCols.length >= 6) {
          phonetic = remainingCols[1];
          partOfSpeech = remainingCols[2];
          translation = remainingCols[3];
          definition = remainingCols[4];
          rawExample = remainingCols[5];
          if (!imageUrl && remainingCols.length >= 7 && remainingCols[6]) {
            imageUrl = remainingCols[6];
          }
        } else if (remainingCols.length === 5) {
          if (isPos(remainingCols[2])) {
            phonetic = remainingCols[1];
            partOfSpeech = remainingCols[2];
            translation = remainingCols[3];
            rawExample = remainingCols[4];
          } else {
            phonetic = remainingCols[1];
            translation = remainingCols[2];
            definition = remainingCols[3];
            rawExample = remainingCols[4];
          }
        } else if (remainingCols.length === 4) {
          if (isPos(remainingCols[2])) {
            phonetic = remainingCols[1];
            partOfSpeech = remainingCols[2];
            translation = remainingCols[3];
          } else if (isPos(remainingCols[1])) {
            partOfSpeech = remainingCols[1];
            translation = remainingCols[2];
            rawExample = remainingCols[3];
          } else {
            phonetic = remainingCols[1];
            translation = remainingCols[2];
            rawExample = remainingCols[3];
          }
        } else if (remainingCols.length === 3) {
          if (isPos(remainingCols[1])) {
            partOfSpeech = remainingCols[1];
            translation = remainingCols[2];
          } else {
            phonetic = remainingCols[1];
            translation = remainingCols[2];
          }
        } else if (remainingCols.length === 2) {
          translation = remainingCols[1];
        }
      }
    }

    // Tự động tách câu ví dụ và bản dịch nghĩa ví dụ nếu có
    const { sentence: finalExample, meaning: autoMeaning } = extractExampleAndMeaning(
      rawExample,
      explicitMeaning
    );

    if (word && translation) {
      result.push({
        word,
        kanji: isJapanese && kanji ? kanji : undefined,
        furigana: isJapanese && furigana ? furigana : undefined,
        romaji: isJapanese && romaji ? romaji : undefined,
        phonetic: phonetic ? normalizePhonetic(phonetic, isJapanese) : (romaji || furigana || undefined),
        partOfSpeech: partOfSpeech ? normalizePos(partOfSpeech, isJapanese) : undefined,
        translation,
        definition: definition || undefined,
        example: finalExample || undefined,
        exampleMeaning: autoMeaning || undefined,
        imageUrl: imageUrl || undefined,
      });
    }
  }

  return result;
}

/** Tách một dòng text thành các ô theo dấu |, \t, hoặc dấu phẩy CSV chuẩn */
function parseTextLine(line: string): string[] {
  // 1. Phân cách bằng dấu pipe (Markdown table)
  if (line.includes("|")) {
    const rawCols = line.split("|").map((c) => c.trim());
    const start = line.startsWith("|") ? 1 : 0;
    const end = line.endsWith("|") ? rawCols.length - 1 : rawCols.length;
    return rawCols.slice(start, end).map((c) => c.trim());
  }

  // 2. Phân cách bằng tab (Excel / Google Sheets Copy-Paste)
  if (line.includes("\t")) {
    return line.split("\t").map((c) => c.trim());
  }

  // 3. Phân cách bằng dấu chấm phẩy
  if (line.includes(";")) {
    return line.split(";").map((c) => c.trim());
  }

  // 4. Phân cách bằng dấu phẩy CSV có hỗ trợ ngoặc kép
  if (line.includes(",")) {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  return [];
}

function parseCardsFromText(rawText: string, isJapanese: boolean = true): CardInput[] {
  const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const rows: string[][] = [];

  for (const line of lines) {
    if (line.match(/^\|?[-:\s|]+\|?$/) && line.includes("-")) continue;

    const cols = parseTextLine(line);
    if (cols.length >= 2) {
      rows.push(cols);
    }
  }

  return parseCardsFromRows(rows, isJapanese);
}

/** Tải file Excel mẫu (.xlsx) chuẩn 10 cột khớp 100% với Database */
function downloadSampleExcel(isJapanese: boolean) {
  const wb = XLSX.utils.book_new();
  const data = isJapanese
    ? [
        [
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
        ],
        [
          "さくら",
          "桜",
          "さくら",
          "sakura",
          "Danh từ",
          "Hoa anh đào",
          "Biểu tượng mùa xuân nước Nhật, vẻ đẹp thanh khiết",
          "春になると桜が綺麗に咲きます。",
          "Khi mùa xuân đến, hoa anh đào nở rất đẹp.",
          "https://images.unsplash.com/photo-1522383225653-ed111181a951",
        ],
        [
          "たべる",
          "食べる",
          "たべる",
          "taberu",
          "Động từ N2",
          "Ăn",
          "Hành động ăn uống hàng ngày, dạng lịch sự là 食べます",
          "毎朝パンを食べます。",
          "Mỗi sáng tôi ăn bánh mì.",
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        ],
        [
          "いちごいちえ",
          "一期一会",
          "いちごいちえ",
          "ichigoichie",
          "Thành ngữ",
          "Đời người chỉ gặp một lần",
          "Bắt nguồn từ trà đạo, trân trọng từng phút giây hội ngộ",
          "一期一会の精神でおもてなしをする。",
          "Tiếp đãi bằng tinh thần trân quý từng phút giây gặp gỡ.",
          "",
        ],
        [
          "なつかしい",
          "懐かしい",
          "なつかしい",
          "natsukashii",
          "Tính từ -i",
          "Hoài niệm / Nhớ nhung",
          "Nhớ về kỷ niệm xưa cũ đẹp đẽ với cảm xúc ấm áp",
          "昔の写真を見て、懐かしくなりました。",
          "Nhìn lại tấm ảnh xưa lòng lại thấy bồi hồi nhớ nhung.",
          "",
        ],
        [
          "しんかんせん",
          "新幹線",
          "しんかんせん",
          "shinkansen",
          "Danh từ",
          "Tàu cao tốc Shinkansen",
          "Tàu siêu tốc biểu tượng công nghệ đường sắt Nhật Bản",
          "新幹線で東京から京都まで行きます。",
          "Đi từ Tokyo đến Kyoto bằng tàu cao tốc Shinkansen.",
          "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf",
        ],
      ]
    : [
        [
          "Từ vựng",
          "Phiên âm IPA",
          "Loại từ",
          "Nghĩa tiếng Việt",
          "Định nghĩa tiếng Anh",
          "Ví dụ",
          "Có dịch nghĩa",
          "Hình ảnh",
        ],
        [
          "Perseverance",
          "/ˌpɜː.sɪˈvɪə.rəns/",
          "NOUN",
          "Sự kiên trì, bền bỉ",
          "Continued effort and determination despite difficulties or failure",
          "His perseverance was rewarded when he finally passed the exam.",
          "Sự kiên trì của anh ấy đã được đền đáp khi anh ấy vượt qua kỳ thi.",
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd",
        ],
        [
          "Accomplish",
          "/əˈkʌm.plɪʃ/",
          "VERB",
          "Hoàn thành, đạt được",
          "To achieve or complete successfully",
          "She accomplished all her goals for the year.",
          "Cô ấy đã hoàn thành tất cả mục tiêu trong năm.",
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        ],
        [
          "Resilient",
          "/rɪˈzɪl.jənt/",
          "ADJ",
          "Kiên cường, mau phục hồi",
          "Able to recover quickly from difficult conditions",
          "Children are often remarkably resilient in facing changes.",
          "Trẻ em thường kiên cường một cách đáng ngạc nhiên trước thay đổi.",
          "",
        ],
        [
          "Piece of cake",
          "/ˌpiːs əv ˈkeɪk/",
          "IDIOM",
          "Dễ như ăn kẹo, rất dễ dàng",
          "Something that is very easy and simple to do",
          "The interview was a piece of cake; I got the job!",
          "Buổi phỏng vấn dễ như ăn kẹo; tôi đã nhận được việc!",
          "",
        ],
      ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = isJapanese
    ? [
        { wch: 18 }, // Từ vựng (Kana)
        { wch: 15 }, // Kanji
        { wch: 18 }, // Furigana
        { wch: 15 }, // Romaji
        { wch: 15 }, // Loại từ
        { wch: 26 }, // Nghĩa
        { wch: 42 }, // Ngữ cảnh
        { wch: 45 }, // Ví dụ
        { wch: 45 }, // Có dịch nghĩa
        { wch: 35 }, // Hình ảnh
      ]
    : [
        { wch: 18 },
        { wch: 22 },
        { wch: 14 },
        { wch: 26 },
        { wch: 45 },
        { wch: 55 },
        { wch: 45 },
        { wch: 35 },
      ];

  XLSX.utils.book_append_sheet(wb, ws, isJapanese ? "TuVungNhat" : "TuVungAnh");
  XLSX.writeFile(wb, isJapanese ? "mau_tu_vung_tieng_nhat_10cot.xlsx" : "mau_tu_vung_tieng_anh.xlsx");
}

const JAPANESE_SAMPLE_MARKDOWN = `| Từ vựng (Kana) | Kanji | Furigana | Romaji | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ | Có dịch nghĩa | Hình ảnh |
| さくら | 桜 | さくら | sakura | Danh từ | Hoa anh đào | Biểu tượng mùa xuân nước Nhật | 春になると桜が綺麗に咲きます。 | Khi mùa xuân đến, hoa anh đào nở rất đẹp. | https://images.unsplash.com/photo-1522383225653-ed111181a951 |
| たべる | 食べる | たべる | taberu | Động từ N2 | Ăn | Hành động ăn uống hàng ngày | 毎朝パンを食べます。 | Mỗi sáng tôi ăn bánh mì. | https://images.unsplash.com/photo-1546069901-ba9599a7e63c |
| いちごいちえ | 一期一会 | いちごいちえ | ichigoichie | Thành ngữ | Đời người chỉ gặp một lần | Bắt nguồn từ trà đạo | 一期一会の精神でおもてなしをする。 | Tiếp đãi bằng tinh thần trân quý từng phút giây gặp gỡ. | |
| なつかしい | 懐かしい | なつかしい | natsukashii | Tính từ -i | Hoài niệm / Nhớ nhung | Nhớ về kỷ niệm xưa cũ | 昔の写真を見て、懐かしくなりました。 | Nhìn lại tấm ảnh xưa lòng lại thấy bồi hồi. | |`;

const JAPANESE_SAMPLE_TAB = `さくら	桜	さくら	sakura	Danh từ	Hoa anh đào	Biểu tượng mùa xuân nước Nhật	春になると桜が綺麗に咲きます。	Khi mùa xuân đến, hoa anh đào nở rất đẹp.	https://images.unsplash.com/photo-1522383225653-ed111181a951
たべる	食べる	たべる	taberu	Động từ N2	Ăn	Hành động ăn uống hàng ngày	毎朝パンを食べます。	Mỗi sáng tôi ăn bánh mì.	https://images.unsplash.com/photo-1546069901-ba9599a7e63c
いちごいちえ	一期一会	いちごいちえ	ichigoichie	Thành ngữ	Đời người chỉ gặp một lần	Bắt nguồn từ trà đạo	一期一会の精神でおもてなしをする。	Tiếp đãi bằng tinh thần trân quý từng phút giây gặp gỡ.	
なつかしい	懐かしい	なつかしい	natsukashii	Tính từ -i	Hoài niệm / Nhớ nhung	Nhớ về kỷ niệm xưa cũ	昔の写真を見て、懐かしくなりました。	Nhìn lại tấm ảnh xưa lòng lại thấy bồi hồi.	`;

export default function BulkImport({ onImport, onClose, folderLanguage = "japanese" }: BulkImportProps) {
  const [activeTab, setActiveTab] = useState<"excel" | "text">("excel");
  const [text, setText] = useState("");
  const [excelCards, setExcelCards] = useState<CardInput[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isJapanese = (folderLanguage ?? "").toLowerCase() === "japanese";

  // Đếm thẻ từ văn bản
  const parsedTextCards = useMemo(() => {
    if (!text.trim()) return [];
    return parseCardsFromText(text, isJapanese);
  }, [text, isJapanese]);

  const activeCards = activeTab === "excel" ? excelCards : parsedTextCards;

  // Xử lý file Excel được tải lên
  const processExcelFile = useCallback(async (file: File) => {
    try {
      setIsParsingFile(true);
      setFileName(file.name);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        alert("File không chứa trang tính (sheet) hợp lệ.");
        return;
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      const parsed = parseCardsFromRows(rawRows, isJapanese);
      if (parsed.length === 0) {
        alert("Không tìm thấy từ vựng hợp lệ trong file Excel. Vui lòng kiểm tra lại cấu trúc cột hoặc tải file mẫu.");
      }
      setExcelCards(parsed);
    } catch (err) {
      console.error("Lỗi đọc file Excel:", err);
      alert("Đã xảy ra lỗi khi đọc file Excel. Vui lòng đảm bảo file có định dạng .xlsx, .xls hoặc .csv.");
    } finally {
      setIsParsingFile(false);
    }
  }, [isJapanese]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  // Sao chép mẫu vào clipboard
  const handleCopySample = (type: "markdown" | "tab") => {
    const content = type === "markdown" ? JAPANESE_SAMPLE_MARKDOWN : JAPANESE_SAMPLE_TAB;
    navigator.clipboard.writeText(content).then(() => {
      setCopyFeedback(`Đã sao chép mẫu ${type === "markdown" ? "Markdown" : "Excel (Tab)"}!`);
      setTimeout(() => setCopyFeedback(null), 3000);
    });
  };

  // Dán mẫu nhanh vào textarea
  const handleApplySampleToText = (type: "markdown" | "tab") => {
    setText(type === "markdown" ? JAPANESE_SAMPLE_MARKDOWN : JAPANESE_SAMPLE_TAB);
  };

  // Thực hiện import vào Database
  const executeImport = async (cardsToImport: CardInput[]) => {
    if (cardsToImport.length === 0) return;
    setIsImporting(true);

    try {
      const created = await onImport(cardsToImport);
      const createdCount = typeof created === "number" ? created : cardsToImport.length;
      const skipped = cardsToImport.length - createdCount;
      alert(
        `Đã nhập thành công ${createdCount} thẻ từ vựng vào Database!` +
          (skipped > 0 ? ` (${skipped} thẻ bị bỏ qua do đã đạt giới hạn thư mục)` : "")
      );
      setText("");
      setExcelCards([]);
      setFileName("");
      onClose?.();
    } catch (error) {
      console.error("Lỗi khi nhập thẻ:", error);
      alert("Đã xảy ra lỗi trong quá trình lưu thẻ.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="animate-fade-in relative mb-6 overflow-hidden rounded-2xl border border-[#E2E4E9] bg-white p-5 sm:p-7 shadow-lg">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#586380] hover:bg-[#EDEFF4] hover:text-[#1A1D28] transition-all cursor-pointer z-10"
          title="Đóng bảng nhập nhanh"
          aria-label="Đóng bảng nhập nhanh"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Header & Tabs */}
      <div className="mb-5 pr-10">
        <h3 className="text-lg font-bold text-[#1A1D28] mb-1.5 flex items-center gap-2">
          <span>⚡</span> Nhập Từ Vựng Hàng Loạt ({isJapanese ? "Tiếng Nhật 🇯🇵" : "Tiếng Anh 🇬🇧"})
        </h3>
        <p className="text-xs text-[#586380] mb-3">
          {isJapanese
            ? "Cấu trúc Database chuẩn: Từ vựng (Kana) | Kanji | Furigana | Romaji | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ | Có dịch nghĩa | Hình ảnh"
            : "Cấu trúc Database chuẩn: Từ vựng | Phiên âm IPA | Loại từ | Nghĩa tiếng Việt | Định nghĩa | Ví dụ | Có dịch nghĩa | Link ảnh"}
        </p>

        {/* Tab switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("excel")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "excel"
                ? "bg-[#4255FF] text-white shadow-xs"
                : "border border-[#E2E4E9] bg-white text-[#586380] hover:bg-[#EDEFF4] hover:text-[#1A1D28]"
            }`}
          >
            <span>📊</span> Nhập Bằng File Excel (.xlsx, .xls, .csv)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "text"
                ? "bg-[#4255FF] text-white shadow-xs"
                : "border border-[#E2E4E9] bg-white text-[#586380] hover:bg-[#EDEFF4] hover:text-[#1A1D28]"
            }`}
          >
            <span>📝</span> Dán Bảng / Text Nhanh (Markdown, Sheets, CSV)
          </button>
        </div>
      </div>

      {/* ══════════ TAB 1: NHẬP BẰNG FILE EXCEL ══════════ */}
      {activeTab === "excel" && (
        <div className="space-y-4 animate-fade-in">
          {/* Dropzone hoặc thông tin file */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
              isDragging
                ? "border-[#4255FF] bg-blue-50/50 scale-[1.01]"
                : "border-[#E2E4E9] bg-[#F6F7FB] hover:border-[#4255FF]/60 hover:bg-white"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-[#E2E4E9] text-2xl mb-2.5 shadow-xs">
              📊
            </div>

            <p className="text-sm font-bold text-[#1A1D28] text-center mb-1">
              {fileName ? (
                <span className="text-[#4255FF]">Đã chọn: {fileName}</span>
              ) : (
                "Kéo thả file Excel vào đây, hoặc click để chọn file từ máy"
              )}
            </p>
            <p className="text-xs text-[#586380] text-center">
              Hỗ trợ định dạng Excel <strong>.xlsx</strong>, <strong>.xls</strong>, và <strong>.csv</strong>
            </p>

            {isParsingFile && (
              <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-[#4255FF] animate-pulse">
                <span>⏳ Đang phân tích dữ liệu Excel...</span>
              </div>
            )}
          </div>

          {/* Action Row: Tải file mẫu + Nút đổi file */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => downloadSampleExcel(isJapanese)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E4E9] bg-white px-3.5 py-2 text-xs font-bold text-[#1A1D28] hover:bg-[#EDEFF4] transition-all cursor-pointer shadow-xs"
              title="Tải file Excel mẫu chuẩn 10 cột khớp Database"
            >
              <span>📥</span> Tải File Excel Mẫu Chuẩn ({isJapanese ? "Tiếng Nhật 10 Cột" : "Tiếng Anh"})
            </button>

            {fileName && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFileName("");
                  setExcelCards([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
              >
                ✕ Hủy chọn file này
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════ TAB 2: DÁN BẢNG / TEXT NHANH ══════════ */}
      {activeTab === "text" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#586380] leading-relaxed">
                Dán bảng <strong>Markdown</strong> (dấu <code>|</code>), copy trực tiếp các cột từ <strong>Excel / Google Sheets</strong> (dấu Tab <code>\t</code>), hoặc file CSV (dấu phẩy <code>,</code>).
              </p>

              {/* Nút dán mẫu nhanh */}
              {isJapanese && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplySampleToText("markdown")}
                    className="text-[11px] font-bold text-[#4255FF] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-all cursor-pointer"
                    title="Điền dữ liệu mẫu Markdown vào ô nhập"
                  >
                    📝 Thử mẫu Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySampleToText("tab")}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                    title="Điền dữ liệu mẫu Excel Tab vào ô nhập"
                  >
                    📊 Thử mẫu Excel Tab
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[#1A1D28]">Thứ tự các cột chuẩn:</span>
                <span className="rounded-lg bg-[#F6F7FB] px-2.5 py-1 border border-[#E2E4E9] text-[#1A1D28] font-mono text-[11px] font-semibold">
                  {isJapanese
                    ? "Từ vựng (Kana) | Kanji | Furigana | Romaji | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ | Có dịch nghĩa | Hình ảnh"
                    : "Từ vựng | Phiên âm IPA | Loại từ | Nghĩa | Định nghĩa | Ví dụ | Có dịch nghĩa | Link ảnh"}
                </span>
              </div>

              {isJapanese && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopySample("markdown")}
                    className="text-[#586380] hover:text-[#1A1D28] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>📋 Copy mẫu Markdown</span>
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => handleCopySample("tab")}
                    className="text-[#586380] hover:text-[#1A1D28] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>📋 Copy mẫu Excel Tab</span>
                  </button>
                </div>
              )}
            </div>

            {copyFeedback && (
              <div className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-fade-in inline-block">
                ✅ {copyFeedback}
              </div>
            )}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              isJapanese
                ? `Dán bảng từ vựng vào đây (hỗ trợ Markdown, Excel Tab, CSV)...\n\nVí dụ bảng Markdown chuẩn:\n| Từ vựng (Kana) | Kanji | Furigana | Romaji | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ | Có dịch nghĩa | Hình ảnh |\n| さくら | 桜 | さくら | sakura | Danh từ | Hoa anh đào | Biểu tượng mùa xuân | 春になると桜が綺麗に咲きます。 | Khi xuân đến hoa anh đào nở rất đẹp. | https://images.unsplash.com/photo-1522383225653-ed111181a951 |\n| たべる | 食べる | たべる | taberu | Động từ N2 | Ăn | Ăn uống hàng ngày | 毎朝パンを食べます。 | Mỗi sáng tôi ăn bánh mì. | https://images.unsplash.com/photo-1546069901-ba9599a7e63c |`
                : `Dán bảng từ vựng vào đây...\n| Từ vựng | Phiên âm IPA | Loại từ | Nghĩa | Định nghĩa | Ví dụ | Có dịch nghĩa | Link ảnh |\n| Perseverance | /ˌpɜː.sɪˈvɪə.rəns/ | NOUN | Sự kiên trì | Continued effort despite difficulties | His perseverance was rewarded. | Sự kiên trì của anh ấy đã được đền đáp. | https://images.unsplash.com/photo-1517838277536-f5f99be501cd |`
            }
            className="w-full h-56 sm:h-64 p-3.5 rounded-xl bg-white border border-[#E2E4E9] text-[#1A1D28] text-xs font-mono outline-none focus:border-[#4255FF] focus:ring-2 focus:ring-[#4255FF]/10 transition-all resize-y leading-relaxed placeholder:text-[#939BB4]"
          />

          {text && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setText("")}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                ✕ Xóa trắng nội dung
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════ BẢNG XEM TRƯỚC DỮ LIỆU CHUNG (LIVE PREVIEW CHO CẢ 2 TAB) ══════════ */}
      {activeCards.length > 0 && (
        <div className="mt-5 rounded-xl border border-[#E2E4E9] bg-white overflow-hidden shadow-xs animate-fade-in-up">
          <div className="p-3 bg-[#F6F7FB] border-b border-[#E2E4E9] flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-[#1A1D28] flex items-center gap-1.5">
              <span>👀</span> Xem trước dữ liệu ({activeCards.length} thẻ hợp lệ sẵn sàng tạo):
            </span>
            <span className="text-[11px] text-[#586380] flex items-center gap-2 flex-wrap">
              {isJapanese && (
                <>
                  <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 font-semibold">
                    {activeCards.filter((c) => c.kanji).length} Kanji
                  </span>
                  <span className="bg-sakura/10 text-sakura-light px-1.5 py-0.5 rounded border border-sakura/25 font-semibold">
                    {activeCards.filter((c) => c.furigana).length} Furigana
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-mono font-semibold">
                    {activeCards.filter((c) => c.romaji || c.phonetic).length} Romaji
                  </span>
                </>
              )}
              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                {activeCards.filter((c) => c.example).length} Ví dụ
              </span>
              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-semibold">
                {activeCards.filter((c) => c.imageUrl).length} Hình ảnh
              </span>
            </span>
          </div>

          <div className="max-h-64 sm:max-h-80 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F7FB] sticky top-0 border-b border-[#E2E4E9] text-[#586380] font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5">{isJapanese ? "Kana (Từ vựng)" : "Từ vựng"}</th>
                  {isJapanese && <th className="p-2.5">Kanji</th>}
                  {isJapanese && <th className="p-2.5">Furigana</th>}
                  <th className="p-2.5">{isJapanese ? "Romaji" : "Phiên âm IPA"}</th>
                  <th className="p-2.5">Loại từ</th>
                  <th className="p-2.5">Nghĩa</th>
                  <th className="p-2.5">{isJapanese ? "Ngữ cảnh" : "Định nghĩa"}</th>
                  <th className="p-2.5">Ví dụ</th>
                  <th className="p-2.5">Có dịch nghĩa</th>
                  <th className="p-2.5 text-center">Hình ảnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4E9] font-medium text-[#1A1D28]">
                {activeCards.map((c, idx) => (
                  <tr key={idx} className="hover:bg-[#F6F7FB] transition-colors">
                    <td className="p-2.5 text-center text-[#939BB4] font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-[#1A1D28]">{c.word}</td>
                    {isJapanese && (
                      <td className="p-2.5 font-bold text-red-600 font-jp">{c.kanji || "—"}</td>
                    )}
                    {isJapanese && (
                      <td className="p-2.5 text-sakura-light font-medium">{c.furigana || "—"}</td>
                    )}
                    <td className="p-2.5 text-[#4255FF] font-mono font-semibold">
                      {c.romaji || c.phonetic ? `/${c.romaji || c.phonetic}/` : "—"}
                    </td>
                    <td className="p-2.5">
                      {c.partOfSpeech ? (
                        <span className="rounded bg-[#EDEFF4] px-1.5 py-0.5 text-[10px] font-bold text-[#586380]">
                          {c.partOfSpeech}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2.5 font-bold text-[#1A1D28]">{c.translation}</td>
                    <td className="p-2.5 text-[#586380] max-w-[180px] truncate" title={c.definition}>
                      {c.definition || "—"}
                    </td>
                    <td className="p-2.5 text-[#1A1D28] max-w-[200px] truncate" title={c.example}>
                      {c.example ? `"${c.example}"` : "—"}
                    </td>
                    <td className="p-2.5 text-emerald-700 italic max-w-[180px] truncate" title={c.exampleMeaning}>
                      {c.exampleMeaning || "—"}
                    </td>
                    <td className="p-2.5 text-center">
                      {c.imageUrl ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#23B26D] font-bold" title={c.imageUrl}>
                          <span>🖼️</span> Có
                        </span>
                      ) : (
                        <span className="text-[#939BB4]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Thanh điều khiển Submit chung phía dưới */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-[#E2E4E9]">
        <div className="text-xs font-semibold text-[#586380]">
          {activeCards.length > 0 ? (
            <span className="text-[#23B26D] flex items-center gap-1.5 flex-wrap">
              <span className="h-2 w-2 rounded-full bg-[#23B26D] animate-pulse" />
              Đã nhận diện <strong>{activeCards.length}</strong> thẻ từ vựng hợp lệ sẵn sàng tạo vào Database!
            </span>
          ) : (
            <span className="text-[#939BB4]">
              {activeTab === "excel"
                ? "Chưa có file nào được tải lên (hãy kéo thả hoặc click chọn file Excel)"
                : "Chưa có dữ liệu (hãy dán bảng văn bản vào ô trên hoặc bấm 'Thử mẫu')"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E2E4E9] text-xs sm:text-sm font-semibold text-[#586380] hover:bg-[#EDEFF4] transition-all cursor-pointer"
            >
              ✕ Hủy bỏ
            </button>
          )}
          <button
            type="button"
            onClick={() => executeImport(activeCards)}
            disabled={isImporting || activeCards.length === 0}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#4255FF] text-white hover:bg-[#3344DD] active:scale-98 transition-all disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                <span>Đang lưu vào Database...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>Lưu vào Database ({activeCards.length} thẻ)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
