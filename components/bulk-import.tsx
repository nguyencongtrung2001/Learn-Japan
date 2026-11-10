"use client";

import { useState, useMemo } from "react";
import type { CardInput } from "@/lib/card-utils";

export interface BulkImportProps {
  /** Trả về số thẻ thực sự được tạo (có thể ít hơn số dòng nếu vượt giới hạn thư mục). */
  onImport: (rows: CardInput[]) => Promise<number | void>;
  /** Callback đóng form nhập nhanh */
  onClose?: () => void;
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

function parseCardsFromText(rawText: string): CardInput[] {
  const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const result: CardInput[] = [];

  // Kiểm tra dòng tiêu đề header (nếu người dùng copy cả hàng header)
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

  if (lines.length > 0) {
    const firstLineLower = lines[0].toLowerCase();
    if (
      (firstLineLower.includes("word") ||
        firstLineLower.includes("từ vựng") ||
        firstLineLower.includes("kanji") ||
        firstLineLower.includes("kana") ||
        firstLineLower.includes("tiếng nhật")) &&
      (firstLineLower.includes("translation") ||
        firstLineLower.includes("nghĩa") ||
        firstLineLower.includes("dịch") ||
        firstLineLower.includes("meaning"))
    ) {
      const headerCols = lines[0].includes("|")
        ? lines[0].split("|").map((c) => c.trim()).filter(Boolean)
        : lines[0].split("\t").map((c) => c.trim());

      headerMap = {};
      headerCols.forEach((col, idx) => {
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
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bỏ qua dòng phân cách Markdown table: |---|---|...
    if (line.match(/^\|?[-:\s|]+\|?$/) && line.includes("-")) continue;
    // Bỏ qua dòng header đã nhận diện
    if (i === 0 && headerMap) continue;

    let cols: string[] = [];

    if (line.includes("|")) {
      // Định dạng Markdown Table
      const rawCols = line.split("|").map((c) => c.trim());
      const start = line.startsWith("|") ? 1 : 0;
      const end = line.endsWith("|") ? rawCols.length - 1 : rawCols.length;
      cols = rawCols.slice(start, end).map((c) => c.trim());
    } else if (line.includes("\t")) {
      // Định dạng copy từ Excel (phân cách bằng Tab)
      cols = line.split("\t").map((c) => c.trim());
    } else if (line.includes(";")) {
      // Hỗ trợ CSV với dấu ;
      cols = line.split(";").map((c) => c.trim());
    } else {
      continue;
    }

    // Làm sạch ký tự định dạng markdown như **bold** hoặc *italic*
    cols = cols.map((c) => c.replace(/\*\*/g, "").replace(/\*/g, "").trim());
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

export default function BulkImport({ onImport, onClose }: BulkImportProps) {
  const [text, setText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Đếm nhanh số thẻ nhận diện được theo thời gian thực
  const parsedPreview = useMemo(() => {
    if (!text.trim()) return [];
    return parseCardsFromText(text);
  }, [text]);

  const handleParseAndImport = async () => {
    if (!text.trim()) return;
    setIsImporting(true);

    try {
      const importedCards = parseCardsFromText(text);

      if (importedCards.length > 0) {
        const created = await onImport(importedCards);
        const createdCount =
          typeof created === "number" ? created : importedCards.length;
        const skipped = importedCards.length - createdCount;
        alert(
          `Đã nhập nhanh thành công ${createdCount} thẻ!` +
            (skipped > 0
              ? ` (${skipped} thẻ bị bỏ qua do đã đạt giới hạn thư mục)`
              : "")
        );
        setText("");
        onClose?.();
      } else {
        alert(
          "Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại định dạng bảng (sử dụng dấu | hoặc copy từ Excel)."
        );
      }
    } catch (error) {
      console.error("Lỗi khi nhập nhanh:", error);
      alert("Đã xảy ra lỗi khi xử lý văn bản.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in relative mb-6 overflow-hidden p-6 shadow-2xl sm:p-8 border border-border/80">
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

      <div className="mb-4 pr-10">
        <h3 className="text-xl font-extrabold mb-1.5 gradient-text flex items-center gap-2">
          ⚡ Nhập Nhanh Từ Vựng (Hỗ trợ 🇯🇵 Tiếng Nhật & 🇬🇧 Tiếng Anh)
        </h3>
        <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
          Dán bảng Markdown (dấu <code>|</code>) hoặc copy trực tiếp từ Excel.
          Cấu trúc chuẩn tiếng Nhật đầy đủ 8 cột:{" "}
          <strong className="text-foreground">
            Từ vựng (Kana) | Chữ Hán (Kanji) | Furigana/Romaji | Loại từ | Nghĩa | Ngữ cảnh sử dụng | Câu ví dụ | Link ảnh
          </strong>
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground-dim">
          <span className="font-semibold text-foreground-muted">Chữ Hán:</span>
          <span className="rounded bg-sakura/15 border border-sakura/30 px-1.5 py-0.5 font-bold text-sakura-light">
            Kanji: 桜 / 食べる
          </span>
          <span className="ml-1 font-semibold text-foreground-muted">Loại từ tiếng Nhật:</span>
          {["Danh từ", "Động từ N1/N2/N3", "Tính từ -i/-na", "Phó từ", "Cụm từ", "Thành ngữ"].map(
            (tag) => (
              <span
                key={tag}
                className="rounded bg-rose/10 border border-rose/25 px-1.5 py-0.5 font-bold text-rose"
              >
                {tag}
              </span>
            )
          )}
          <span className="ml-1 font-semibold text-foreground-muted">Furigana / Romaji:</span>
          <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-400">
            さくら / sakura
          </span>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Ví dụ bảng Markdown 8 cột tiếng Nhật chuẩn (Từ vựng | Kanji | Furigana | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ | Link ảnh):\n| さくら | 桜 | sakura | Danh từ | Hoa anh đào | Biểu tượng mùa xuân, triết lý vẻ đẹp ngắn ngủi | 春になると桜が綺麗に咲きます。 | https://images.unsplash.com/photo-1522383225653-ed111181a951 |\n| たべる | 食べる | taberu | Động từ N2 | Ăn | Hành động ăn uống hàng ngày, dạng lịch sử là 食べます | 毎朝パンを食べます。(Mỗi sáng tôi ăn bánh mì.) | https://images.unsplash.com/photo-1546069901-ba9599a7e63c |\n| いちごいちえ | 一期一会 | ichigoichie | Thành ngữ | Đời người chỉ gặp một lần | Bắt nguồn từ trà đạo, trân trọng mọi cuộc gặp gỡ | 一期一会の精神でおもてなしをする。(Tiếp đãi bằng tinh thần trân quý từng phút giây hội ngộ.) | |\n| なつかしい | 懐かしい | natsukashii | Tính từ -i | Nhớ nhung / Hoài niệm | Dùng khi nhớ về kỉ niệm xưa cũ | 昔の写真を見て、懐かしくなりました。 | |\n\nHoặc bảng tiếng Anh:\n| Perseverance | | /ˌpɜː.sɪˈvɪə.rəns/ | NOUN | Sự kiên trì | Continued effort to achieve | Through perseverance, he succeeded. |`}
        className="w-full h-64 sm:h-72 p-4 rounded-xl bg-surface/70 border border-border/80 text-foreground text-xs sm:text-sm font-mono outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all resize-y leading-relaxed"
      />

      {/* Live detection preview bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border/50">
        <div className="text-xs font-semibold text-foreground-muted">
          {parsedPreview.length > 0 ? (
            <span className="text-emerald-400 flex items-center gap-1.5 flex-wrap">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Đã phát hiện <strong>{parsedPreview.length}</strong> thẻ hợp lệ (
              {parsedPreview.filter((p) => p.kanji).length} có Kanji,{" "}
              {parsedPreview.filter((p) => p.phonetic).length} có Phiên âm/Furigana,{" "}
              {parsedPreview.filter((p) => p.imageUrl).length} có Hình ảnh,{" "}
              {parsedPreview.filter((p) => p.partOfSpeech).length} có Loại từ)
            </span>
          ) : (
            <span className="text-foreground-dim">
              Chưa có dữ liệu (hãy dán văn bản vào ô trên)
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
            onClick={handleParseAndImport}
            disabled={isImporting || parsedPreview.length === 0}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-sakura to-indigo text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md cursor-pointer"
          >
            {isImporting
              ? "⏳ Đang tạo thẻ..."
              : `✅ Tạo danh sách (${parsedPreview.length} thẻ)`}
          </button>
        </div>
      </div>
    </div>
  );
}
