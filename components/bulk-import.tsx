"use client";

import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import type { CardInput } from "@/lib/card-utils";

export interface BulkImportProps {
  /** Trả về số thẻ thực sự được tạo (có thể ít hơn số dòng nếu vượt giới hạn thư mục). */
  onImport: (rows: CardInput[]) => Promise<number | void>;
  /** Callback đóng form nhập nhanh */
  onClose?: () => void;
  folderLanguage?: string;
}

// Regex nhận diện ký tự tiếng Việt (để phân biệt với Phiên âm tiếng Anh)
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
  // Chứa ký tự phiên âm IPA điển hình
  if (IPA_SPECIAL_CHARS.test(trimmed)) {
    return true;
  }
  return false;
}

function normalizePhonetic(val: string): string {
  const trimmed = val.trim();
  if (!trimmed) return "";
  if (
    (trimmed.startsWith("/") && trimmed.endsWith("/")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return trimmed;
  }
  // Giữ nguyên Furigana (Hiragana/Katakana)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) {
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
    trimmed.startsWith("data:image/")
  ) {
    return true;
  }
  return /\.(jpg|jpeg|png|webp|svg|gif|avif)(\?.*)?$/i.test(trimmed);
}

// Danh sách các loại từ phổ biến để tự động nhận diện thông minh (hỗ trợ cả Tiếng Nhật & Tiếng Anh)
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
  // Các từ viết hoa ngắn (VD: NOUN, VERB, ADJ, ADV, PHRASE, STRUCTURE, CỤM TỪ)
  if (value.length <= 16 && /^[A-ZÀ-Ỹ\s\-_/]+$/.test(value.trim())) {
    return true;
  }
  return false;
}

function normalizePos(value: string): string {
  const clean = value.replace(/[()[\]{}]/g, "").trim();
  const lower = clean.toLowerCase();
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
  return clean.toUpperCase();
}

/**
 * Xử lý dữ liệu bảng (2D array của các ô chuỗi/số) từ Excel hoặc Text
 */
function parseCardsFromRows(rows: (string | number | undefined)[][]): CardInput[] {
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
    phonetic?: number;
    pos?: number;
    translation?: number;
    definition?: number;
    example?: number;
    imageUrl?: number;
  } | null = null;

  const firstLine = cleanRows[0];
  const firstLineJoined = firstLine.join(" ").toLowerCase();

  if (
    (firstLineJoined.includes("word") ||
      firstLineJoined.includes("từ vựng") ||
      firstLineJoined.includes("kanji") ||
      firstLineJoined.includes("kana") ||
      firstLineJoined.includes("tiếng nhật")) &&
    (firstLineJoined.includes("translation") ||
      firstLineJoined.includes("nghĩa") ||
      firstLineJoined.includes("dịch") ||
      firstLineJoined.includes("meaning"))
  ) {
    headerMap = {};
    firstLine.forEach((col, idx) => {
      const cLower = col.toLowerCase();
      if (
        cLower.includes("ảnh") ||
        cLower.includes("hình") ||
        cLower.includes("image") ||
        cLower.includes("img") ||
        cLower.includes("pic") ||
        cLower.includes("photo")
      ) {
        headerMap!.imageUrl = idx;
      } else if (
        cLower.includes("kanji") ||
        cLower.includes("hán tự") ||
        cLower.includes("chữ hán") ||
        cLower.includes("han tu")
      ) {
        headerMap!.kanji = idx;
      } else if (
        cLower.includes("word") ||
        cLower.includes("từ vựng") ||
        cLower.includes("kana") ||
        cLower.includes("tiếng nhật") ||
        cLower.includes("term")
      ) {
        headerMap!.word = idx;
      } else if (
        cLower.includes("phiên âm") ||
        cLower.includes("phonetic") ||
        cLower.includes("ipa") ||
        cLower.includes("phát âm") ||
        cLower.includes("romaji") ||
        cLower.includes("furigana") ||
        cLower.includes("reading")
      ) {
        headerMap!.phonetic = idx;
      } else if (
        cLower.includes("loại từ") ||
        cLower.includes("từ loại") ||
        cLower.includes("pos") ||
        cLower.includes("type")
      ) {
        headerMap!.pos = idx;
      } else if (
        cLower.includes("nghĩa") ||
        cLower.includes("translation") ||
        cLower.includes("meaning") ||
        cLower.includes("dịch")
      ) {
        headerMap!.translation = idx;
      } else if (
        cLower.includes("định nghĩa") ||
        cLower.includes("definition") ||
        cLower.includes("ngữ cảnh") ||
        cLower.includes("sắc thái") ||
        cLower.includes("context") ||
        cLower.includes("explain")
      ) {
        headerMap!.definition = idx;
      } else if (
        cLower.includes("ví dụ") ||
        cLower.includes("example") ||
        cLower.includes("sentence") ||
        cLower.includes("câu")
      ) {
        headerMap!.example = idx;
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
    let phonetic = "";
    let partOfSpeech = "";
    let translation = "";
    let definition = "";
    let example = "";
    let imageUrl = "";

    if (headerMap && headerMap.word !== undefined) {
      word = cols[headerMap.word] || "";
      if (headerMap.kanji !== undefined) kanji = cols[headerMap.kanji] || "";
      if (headerMap.phonetic !== undefined) phonetic = cols[headerMap.phonetic] || "";
      if (headerMap.pos !== undefined) partOfSpeech = cols[headerMap.pos] || "";
      if (headerMap.translation !== undefined) translation = cols[headerMap.translation] || "";
      if (headerMap.definition !== undefined) definition = cols[headerMap.definition] || "";
      if (headerMap.example !== undefined) example = cols[headerMap.example] || "";
      if (headerMap.imageUrl !== undefined) imageUrl = cols[headerMap.imageUrl] || "";
    } else {
      word = cols[0];

      // Tự động tìm cột có link ảnh nếu có
      const imgIdx = cols.findIndex((c, idx) => idx > 0 && isImageUrl(c));
      let remainingCols = cols;
      if (imgIdx > 0) {
        imageUrl = cols[imgIdx];
        remainingCols = cols.filter((_, idx) => idx !== imgIdx);
      }

      // Tự động tìm cột Kanji nếu có (chứa ký tự Hán tự \u4E00-\u9FAF và ngắn gọn không phải câu ví dụ dài)
      const kanjiIdx = remainingCols.findIndex(
        (c, idx) => idx > 0 && idx <= 3 && /[\u4E00-\u9FAF]/.test(c) && c.length <= 15
      );
      if (kanjiIdx > 0) {
        kanji = remainingCols[kanjiIdx];
        remainingCols = remainingCols.filter((_, idx) => idx !== kanjiIdx);
      }

      if (remainingCols.length >= 6) {
        // 6 Cột còn lại: Từ vựng | Phiên âm | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ
        if (isPhonetic(remainingCols[1])) {
          phonetic = remainingCols[1];
          if (isPos(remainingCols[2])) {
            partOfSpeech = remainingCols[2];
            translation = remainingCols[3];
          } else {
            translation = remainingCols[2];
            partOfSpeech = remainingCols[3];
          }
        } else if (isPos(remainingCols[1])) {
          partOfSpeech = remainingCols[1];
          if (isPhonetic(remainingCols[2])) {
            phonetic = remainingCols[2];
            translation = remainingCols[3];
          } else {
            translation = remainingCols[2];
            phonetic = remainingCols[3];
          }
        } else {
          phonetic = remainingCols[1];
          partOfSpeech = remainingCols[2];
          translation = remainingCols[3];
        }
        definition = remainingCols[4] || "";
        example = remainingCols[5] || "";
      } else if (remainingCols.length === 5) {
        // 5 Cột:
        if (isPhonetic(remainingCols[1]) && isPos(remainingCols[2])) {
          phonetic = remainingCols[1];
          partOfSpeech = remainingCols[2];
          translation = remainingCols[3];
          definition = remainingCols[4];
        } else if (isPos(remainingCols[1]) && isPhonetic(remainingCols[2])) {
          partOfSpeech = remainingCols[1];
          phonetic = remainingCols[2];
          translation = remainingCols[3];
          definition = remainingCols[4];
        } else if (isPhonetic(remainingCols[1])) {
          phonetic = remainingCols[1];
          translation = remainingCols[2];
          definition = remainingCols[3];
          example = remainingCols[4];
        } else if (isPos(remainingCols[1])) {
          partOfSpeech = remainingCols[1];
          translation = remainingCols[2];
          definition = remainingCols[3];
          example = remainingCols[4];
        } else if (isPos(remainingCols[2])) {
          translation = remainingCols[1];
          partOfSpeech = remainingCols[2];
          definition = remainingCols[3];
          example = remainingCols[4];
        } else {
          partOfSpeech = remainingCols[1];
          translation = remainingCols[2];
          definition = remainingCols[3];
          example = remainingCols[4];
        }
      } else if (remainingCols.length === 4) {
        if (isPhonetic(remainingCols[1])) {
          phonetic = remainingCols[1];
          translation = remainingCols[2];
          definition = remainingCols[3];
        } else if (isPos(remainingCols[1])) {
          partOfSpeech = remainingCols[1];
          translation = remainingCols[2];
          definition = remainingCols[3];
        } else {
          translation = remainingCols[1];
          definition = remainingCols[2];
          example = remainingCols[3];
        }
      } else if (remainingCols.length === 3) {
        if (isPhonetic(remainingCols[1])) {
          phonetic = remainingCols[1];
          translation = remainingCols[2];
        } else if (isPos(remainingCols[1])) {
          partOfSpeech = remainingCols[1];
          translation = remainingCols[2];
        } else {
          translation = remainingCols[1];
          definition = remainingCols[2];
        }
      } else if (remainingCols.length === 2) {
        translation = remainingCols[1];
      }
    }

    if (word && translation) {
      result.push({
        word,
        kanji: kanji || undefined,
        phonetic: phonetic ? normalizePhonetic(phonetic) : undefined,
        partOfSpeech: partOfSpeech ? normalizePos(partOfSpeech) : undefined,
        translation,
        definition: definition || undefined,
        example: example || undefined,
        imageUrl: imageUrl || undefined,
      });
    }
  }

  return result;
}

function parseCardsFromText(rawText: string): CardInput[] {
  const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const rows: string[][] = [];

  for (const line of lines) {
    if (line.match(/^\|?[-:\s|]+\|?$/) && line.includes("-")) continue;

    let cols: string[] = [];
    if (line.includes("|")) {
      const rawCols = line.split("|").map((c) => c.trim());
      const start = line.startsWith("|") ? 1 : 0;
      const end = line.endsWith("|") ? rawCols.length - 1 : rawCols.length;
      cols = rawCols.slice(start, end).map((c) => c.trim());
    } else if (line.includes("\t")) {
      cols = line.split("\t").map((c) => c.trim());
    } else if (line.includes(";")) {
      cols = line.split(";").map((c) => c.trim());
    } else {
      continue;
    }
    if (cols.length >= 2) {
      rows.push(cols);
    }
  }

  return parseCardsFromRows(rows);
}

/** Tải file Excel mẫu (.xlsx) chuẩn cho người dùng */
function downloadSampleExcel(isJapanese: boolean) {
  const wb = XLSX.utils.book_new();
  const data = isJapanese
    ? [
        [
          "Từ vựng (Kana)",
          "Chữ Hán (Kanji)",
          "Furigana / Romaji",
          "Loại từ",
          "Nghĩa tiếng Việt",
          "Ngữ cảnh sử dụng & Sắc thái",
          "Câu ví dụ thực tế",
          "Link ảnh minh họa",
        ],
        [
          "さくら",
          "桜",
          "sakura",
          "Danh từ",
          "Hoa anh đào",
          "Biểu tượng mùa xuân nước Nhật, vẻ đẹp ngắn ngủi thanh khiết",
          "春になると桜が綺麗に咲きます。(Khi mùa xuân đến, hoa anh đào nở rất đẹp.)",
          "https://images.unsplash.com/photo-1522383225653-ed111181a951",
        ],
        [
          "たべる",
          "食べる",
          "taberu",
          "Động từ N2",
          "Ăn",
          "Hành động ăn uống hàng ngày, lịch sự là 食べます",
          "毎朝パンを食べます。(Mỗi sáng tôi ăn bánh mì.)",
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        ],
        [
          "いちごいちえ",
          "一期一会",
          "ichigoichie",
          "Thành ngữ",
          "Đời người chỉ gặp một lần",
          "Bắt nguồn từ trà đạo, trân trọng từng phút giây hội ngộ",
          "一期一会の精神でおもてなしをする。(Tiếp đãi bằng tinh thần trân quý từng phút giây gặp gỡ.)",
          "",
        ],
        [
          "なつかしい",
          "懐かしい",
          "natsukashii",
          "Tính từ -i",
          "Hoài niệm / Nhớ nhung",
          "Nhớ về kỷ niệm xưa cũ đẹp đẽ với cảm xúc ấm áp",
          "昔の写真を見て、懐かしくなりました。(Nhìn lại tấm ảnh xưa lòng lại thấy bồi hồi.)",
          "",
        ],
      ]
    : [
        [
          "Từ vựng",
          "Phiên âm IPA",
          "Loại từ",
          "Nghĩa tiếng Việt",
          "Định nghĩa / Ngữ cảnh",
          "Ví dụ câu",
          "Link ảnh",
        ],
        [
          "Perseverance",
          "/ˌpɜː.sɪˈvɪə.rəns/",
          "NOUN",
          "Sự kiên trì",
          "Continued effort to do or achieve something despite difficulties",
          "Through hard work and perseverance, he succeeded.",
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd",
        ],
        [
          "Accomplish",
          "/əˈkʌm.plɪʃ/",
          "VERB",
          "Hoàn thành",
          "To achieve or complete successfully",
          "We accomplished all our goals this year.",
          "",
        ],
      ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 15 },
    { wch: 25 },
    { wch: 40 },
    { wch: 50 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "TuVung");
  XLSX.writeFile(wb, isJapanese ? "mau_tu_vung_tieng_nhat.xlsx" : "mau_tu_vung_tieng_anh.xlsx");
}

export default function BulkImport({ onImport, onClose, folderLanguage = "japanese" }: BulkImportProps) {
  const [activeTab, setActiveTab] = useState<"excel" | "text">("excel");
  const [text, setText] = useState("");
  const [excelCards, setExcelCards] = useState<CardInput[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isJapanese = folderLanguage === "japanese";

  // Đếm thẻ từ văn bản
  const parsedTextPreview = useMemo(() => {
    if (!text.trim()) return [];
    return parseCardsFromText(text);
  }, [text]);

  const activeCards = activeTab === "excel" ? excelCards : parsedTextPreview;

  // Xử lý file Excel được tải lên
  const processExcelFile = async (file: File) => {
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

      const parsed = parseCardsFromRows(rawRows);
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
  };

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

  // Thực hiện import vào Database
  const executeImport = async (cardsToImport: CardInput[]) => {
    if (cardsToImport.length === 0) return;
    setIsImporting(true);

    try {
      const created = await onImport(cardsToImport);
      const createdCount = typeof created === "number" ? created : cardsToImport.length;
      const skipped = cardsToImport.length - createdCount;
      alert(
        `Đã nhập thành công ${createdCount} thẻ từ vựng!` +
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
    <div className="glass-card animate-fade-in relative mb-6 overflow-hidden p-5 sm:p-7 shadow-2xl border border-border/80">
      <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-sakura via-indigo to-emerald opacity-60" />

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl text-foreground-muted hover:bg-surface-hover hover:text-foreground hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer z-10"
          title="Đóng bảng nhập nhanh"
          aria-label="Đóng bảng nhập nhanh"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Header & Tabs */}
      <div className="mb-5 pr-10">
        <h3 className="text-xl font-black mb-2 gradient-text flex items-center gap-2">
          <span>⚡</span> Nhập Từ Vựng Hàng Loạt
        </h3>

        {/* Tab switchers */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("excel")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "excel"
                ? "bg-gradient-to-r from-emerald to-teal-500 text-white shadow-md shadow-emerald/20"
                : "border border-border/60 bg-surface/50 text-foreground-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            <span>📊</span> Nhập Bằng File Excel (.xlsx, .xls, .csv)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "text"
                ? "bg-gradient-to-r from-sakura to-indigo text-white shadow-md shadow-indigo/20"
                : "border border-border/60 bg-surface/50 text-foreground-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            <span>📝</span> Dán Bảng / Text Nhanh
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
            className={`relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
              isDragging
                ? "border-emerald bg-emerald/10 scale-[1.01]"
                : "border-border/80 bg-surface/40 hover:border-indigo hover:bg-surface/70"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald/15 text-3xl text-emerald mb-3 shadow-inner">
              📊
            </div>

            <p className="text-base font-bold text-foreground text-center mb-1">
              {fileName ? (
                <span className="text-emerald-400">Đã chọn: {fileName}</span>
              ) : (
                "Kéo thả file Excel vào đây, hoặc click để chọn file"
              )}
            </p>
            <p className="text-xs text-foreground-muted text-center">
              Hỗ trợ định dạng Excel <strong>.xlsx</strong>, <strong>.xls</strong>, và <strong>.csv</strong>
            </p>

            {isParsingFile && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-400 animate-pulse">
                <span>⏳ Đang phân tích dữ liệu Excel...</span>
              </div>
            )}
          </div>

          {/* Action Row: Tải file mẫu + Nút đổi file */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => downloadSampleExcel(isJapanese)}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo/30 bg-indigo/10 px-3.5 py-2 text-xs font-bold text-indigo-light hover:bg-indigo hover:text-white transition-all cursor-pointer shadow-xs"
              title="Tải file Excel mẫu có sẵn cấu trúc cột và dữ liệu mẫu"
            >
              <span>📥</span> Tải File Excel Mẫu Chuẩn ({isJapanese ? "Tiếng Nhật" : "Tiếng Anh"})
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
                className="text-xs font-semibold text-rose hover:underline cursor-pointer"
              >
                ✕ Hủy chọn file này
              </button>
            )}
          </div>

          {/* Bảng xem trước danh sách thẻ đọc được từ file Excel */}
          {excelCards.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border/80 bg-surface/60 overflow-hidden shadow-lg animate-fade-in-up">
              <div className="p-3 bg-surface/80 border-b border-border/70 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>👀</span> Xem trước dữ liệu ({excelCards.length} thẻ được phát hiện):
                </span>
                <span className="text-[11px] text-foreground-dim">
                  {excelCards.filter((c) => c.kanji).length} có Kanji ·{" "}
                  {excelCards.filter((c) => c.phonetic).length} có Furigana/Romaji ·{" "}
                  {excelCards.filter((c) => c.imageUrl).length} có Ảnh
                </span>
              </div>

              <div className="max-h-64 overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface sticky top-0 border-b border-border/60 text-foreground-muted font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5">Từ vựng (Kana)</th>
                      {isJapanese && <th className="p-2.5">Chữ Hán (Kanji)</th>}
                      <th className="p-2.5">Phiên âm / Furigana</th>
                      <th className="p-2.5">Loại từ</th>
                      <th className="p-2.5">Nghĩa tiếng Việt</th>
                      <th className="p-2.5">Ảnh</th>
                      <th className="p-2.5">Ngữ cảnh & Ví dụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    {excelCards.map((c, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="p-2.5 text-center text-foreground-dim">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-foreground">{c.word}</td>
                        {isJapanese && (
                          <td className="p-2.5 font-bold text-sakura-light">{c.kanji || "—"}</td>
                        )}
                        <td className="p-2.5 text-indigo-light font-mono">{c.phonetic || "—"}</td>
                        <td className="p-2.5">
                          {c.partOfSpeech ? (
                            <span className="rounded bg-indigo/15 px-1.5 py-0.5 text-[10px] font-bold text-indigo-light">
                              {c.partOfSpeech}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-2.5 font-semibold text-foreground">{c.translation}</td>
                        <td className="p-2.5">
                          {c.imageUrl ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold" title={c.imageUrl}>
                              <span>🖼️</span> Có ảnh
                            </span>
                          ) : (
                            <span className="text-foreground-dim">—</span>
                          )}
                        </td>
                        <td className="p-2.5 text-foreground-muted max-w-xs truncate">
                          {c.definition || c.example || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ TAB 2: DÁN BẢNG / TEXT NHANH ══════════ */}
      {activeTab === "text" && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Dán bảng Markdown (dấu <code>|</code>) hoặc copy trực tiếp các cột từ Excel.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground-dim">
              <span className="font-semibold text-foreground-muted">Cấu trúc 8 cột:</span>
              <span className="rounded bg-surface px-2 py-0.5 border border-border text-foreground font-mono">
                Từ vựng | Kanji | Furigana | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ | Link ảnh
              </span>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Ví dụ bảng Markdown 8 cột tiếng Nhật chuẩn (Từ vựng | Kanji | Furigana | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ | Link ảnh):\n| さくら | 桜 | sakura | Danh từ | Hoa anh đào | Biểu tượng mùa xuân nước Nhật | 春になると桜が綺麗に咲きます。 | https://images.unsplash.com/photo-1522383225653-ed111181a951 |\n| たべる | 食べる | taberu | Động từ N2 | Ăn | Hành động ăn uống hàng ngày | 毎朝パンを食べます。(Mỗi sáng tôi ăn bánh mì.) | https://images.unsplash.com/photo-1546069901-ba9599a7e63c |\n| いちごいちえ | 一期一会 | ichigoichie | Thành ngữ | Đời người chỉ gặp một lần | Bắt nguồn từ trà đạo | 一期一会の精神でおもてなしをする。 | |`}
            className="w-full h-64 sm:h-72 p-4 rounded-xl bg-surface/70 border border-border/80 text-foreground text-xs sm:text-sm font-mono outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all resize-y leading-relaxed"
          />
        </div>
      )}

      {/* Thanh điều khiển Submit chung phía dưới */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-border/50">
        <div className="text-xs font-semibold text-foreground-muted">
          {activeCards.length > 0 ? (
            <span className="text-emerald-400 flex items-center gap-1.5 flex-wrap">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Đã sẵn sàng <strong>{activeCards.length}</strong> thẻ hợp lệ (
              {activeCards.filter((p) => p.kanji).length} có Kanji,{" "}
              {activeCards.filter((p) => p.phonetic).length} có Phiên âm/Furigana,{" "}
              {activeCards.filter((p) => p.imageUrl).length} có Hình ảnh)
            </span>
          ) : (
            <span className="text-foreground-dim">
              {activeTab === "excel"
                ? "Chưa có file nào được tải lên (hãy kéo thả hoặc click chọn file Excel)"
                : "Chưa có dữ liệu (hãy dán văn bản vào ô trên)"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-semibold text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-all cursor-pointer"
            >
              ✕ Hủy bỏ
            </button>
          )}
          <button
            type="button"
            onClick={() => executeImport(activeCards)}
            disabled={isImporting || activeCards.length === 0}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-sakura to-indigo text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md cursor-pointer"
          >
            {isImporting
              ? "⏳ Đang tạo thẻ..."
              : `✅ Lưu danh sách (${activeCards.length} thẻ)`}
          </button>
        </div>
      </div>
    </div>
  );
}
