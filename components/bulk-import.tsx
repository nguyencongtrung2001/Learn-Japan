"use client";

import { useState, useMemo } from "react";
import type { CardInput } from "@/lib/card-utils";

export interface BulkImportProps {
  /** Trả về số thẻ thực sự được tạo (có thể ít hơn số dòng nếu vượt giới hạn thư mục). */
  onImport: (rows: CardInput[]) => Promise<number | void>;
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
  return `/${trimmed}/`;
}

// Danh sách các loại từ phổ biến để tự động nhận diện thông minh
const POS_KEYWORDS = new Set([
  "noun", "n", "danh từ",
  "verb", "v", "động từ",
  "adj", "adjective", "a", "tính từ",
  "adv", "adverb", "trạng từ",
  "phrase", "phr", "cụm từ", "cum tu",
  "structure", "cấu trúc", "cau truc",
  "idiom", "thành ngữ", "thanh ngu",
  "collocation",
  "preposition", "prep", "giới từ",
  "conjunction", "conj", "liên từ",
  "pronoun", "pron", "đại từ",
  "interjection", "thán từ",
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
  if (lower === "n" || lower === "noun" || lower === "danh từ") return "NOUN";
  if (lower === "v" || lower === "verb" || lower === "động từ") return "VERB";
  if (lower === "adj" || lower === "adjective" || lower === "a" || lower === "tính từ") return "ADJ";
  if (lower === "adv" || lower === "adverb" || lower === "trạng từ") return "ADV";
  if (lower === "phrase" || lower === "phr" || lower === "cụm từ" || lower === "cum tu") return "CỤM TỪ";
  if (lower === "structure" || lower === "cấu trúc" || lower === "cau truc") return "STRUCTURE";
  if (lower === "idiom" || lower === "thành ngữ") return "IDIOM";
  if (lower === "collocation") return "COLLOCATION";
  if (lower === "prep" || lower === "preposition" || lower === "giới từ") return "PREPOSITION";
  return clean.toUpperCase();
}

function parseCardsFromText(rawText: string): CardInput[] {
  const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const result: CardInput[] = [];

  // Kiểm tra dòng tiêu đề header (nếu người dùng copy cả hàng header)
  let headerMap: {
    word?: number;
    phonetic?: number;
    pos?: number;
    translation?: number;
    definition?: number;
    example?: number;
  } | null = null;

  if (lines.length > 0) {
    const firstLineLower = lines[0].toLowerCase();
    if (
      (firstLineLower.includes("word") || firstLineLower.includes("từ vựng")) &&
      (firstLineLower.includes("translation") ||
        firstLineLower.includes("nghĩa") ||
        firstLineLower.includes("meaning"))
    ) {
      const headerCols = lines[0].includes("|")
        ? lines[0].split("|").map((c) => c.trim()).filter(Boolean)
        : lines[0].split("\t").map((c) => c.trim());

      headerMap = {};
      headerCols.forEach((col, idx) => {
        const cLower = col.toLowerCase();
        if (cLower.includes("word") || cLower.includes("từ vựng") || cLower.includes("term")) {
          headerMap!.word = idx;
        } else if (
          cLower.includes("phiên âm") ||
          cLower.includes("phonetic") ||
          cLower.includes("ipa") ||
          cLower.includes("phát âm")
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
          cLower.includes("meaning")
        ) {
          headerMap!.translation = idx;
        } else if (
          cLower.includes("định nghĩa") ||
          cLower.includes("definition") ||
          cLower.includes("explain")
        ) {
          headerMap!.definition = idx;
        } else if (
          cLower.includes("ví dụ") ||
          cLower.includes("example") ||
          cLower.includes("sentence")
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
    let phonetic = "";
    let partOfSpeech = "";
    let translation = "";
    let definition = "";
    let example = "";

    if (headerMap && headerMap.word !== undefined) {
      word = cols[headerMap.word] || "";
      if (headerMap.phonetic !== undefined) phonetic = cols[headerMap.phonetic] || "";
      if (headerMap.pos !== undefined) partOfSpeech = cols[headerMap.pos] || "";
      if (headerMap.translation !== undefined) translation = cols[headerMap.translation] || "";
      if (headerMap.definition !== undefined) definition = cols[headerMap.definition] || "";
      if (headerMap.example !== undefined) example = cols[headerMap.example] || "";
    } else {
      word = cols[0];

      if (cols.length >= 6) {
        // 6 Cột: Từ vựng | Phiên âm | Loại từ | Nghĩa | Định nghĩa | Ví dụ
        // hoặc:  Từ vựng | Loại từ | Phiên âm | Nghĩa | Định nghĩa | Ví dụ
        if (isPhonetic(cols[1])) {
          phonetic = cols[1];
          if (isPos(cols[2])) {
            partOfSpeech = cols[2];
            translation = cols[3];
          } else {
            translation = cols[2];
            partOfSpeech = cols[3];
          }
        } else if (isPos(cols[1])) {
          partOfSpeech = cols[1];
          if (isPhonetic(cols[2])) {
            phonetic = cols[2];
            translation = cols[3];
          } else {
            translation = cols[2];
            phonetic = cols[3];
          }
        } else {
          phonetic = cols[1];
          partOfSpeech = cols[2];
          translation = cols[3];
        }
        definition = cols[4] || "";
        example = cols[5] || "";
      } else if (cols.length === 5) {
        // 5 Cột:
        if (isPhonetic(cols[1]) && isPos(cols[2])) {
          // Từ vựng | Phiên âm | Loại từ | Nghĩa | Ví dụ/Định nghĩa
          phonetic = cols[1];
          partOfSpeech = cols[2];
          translation = cols[3];
          definition = cols[4];
        } else if (isPos(cols[1]) && isPhonetic(cols[2])) {
          // Từ vựng | Loại từ | Phiên âm | Nghĩa | Ví dụ/Định nghĩa
          partOfSpeech = cols[1];
          phonetic = cols[2];
          translation = cols[3];
          definition = cols[4];
        } else if (isPhonetic(cols[1])) {
          // Từ vựng | Phiên âm | Nghĩa | Định nghĩa | Ví dụ
          phonetic = cols[1];
          translation = cols[2];
          definition = cols[3];
          example = cols[4];
        } else if (isPos(cols[1])) {
          // Từ vựng | Loại từ | Nghĩa | Định nghĩa | Ví dụ
          partOfSpeech = cols[1];
          translation = cols[2];
          definition = cols[3];
          example = cols[4];
        } else if (isPos(cols[2])) {
          // Từ vựng | Nghĩa | Loại từ | Định nghĩa | Ví dụ
          translation = cols[1];
          partOfSpeech = cols[2];
          definition = cols[3];
          example = cols[4];
        } else {
          // Mặc định 5 cột: Từ vựng | Loại từ | Nghĩa | Định nghĩa | Ví dụ
          partOfSpeech = cols[1];
          translation = cols[2];
          definition = cols[3];
          example = cols[4];
        }
      } else if (cols.length === 4) {
        if (isPhonetic(cols[1])) {
          phonetic = cols[1];
          translation = cols[2];
          definition = cols[3];
        } else if (isPos(cols[1])) {
          partOfSpeech = cols[1];
          translation = cols[2];
          definition = cols[3];
        } else {
          // Chuẩn cũ 4 cột: Từ vựng | Nghĩa | Định nghĩa | Ví dụ
          translation = cols[1];
          definition = cols[2];
          example = cols[3];
        }
      } else if (cols.length === 3) {
        if (isPhonetic(cols[1])) {
          phonetic = cols[1];
          translation = cols[2];
        } else if (isPos(cols[1])) {
          partOfSpeech = cols[1];
          translation = cols[2];
        } else {
          translation = cols[1];
          definition = cols[2];
        }
      } else if (cols.length === 2) {
        translation = cols[1];
      }
    }

    if (word && translation) {
      result.push({
        word,
        phonetic: phonetic ? normalizePhonetic(phonetic) : undefined,
        partOfSpeech: partOfSpeech ? normalizePos(partOfSpeech) : undefined,
        translation,
        definition: definition || undefined,
        example: example || undefined,
      });
    }
  }

  return result;
}

export default function BulkImport({ onImport }: BulkImportProps) {
  const [isOpen, setIsOpen] = useState(false);
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
        setIsOpen(false);
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-all duration-200 cursor-pointer"
      >
        ⚡ Nhập nhanh (Paste Text)
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-4xl p-6 shadow-2xl relative animate-fade-in-up border border-border/80">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-hover transition-colors text-foreground-muted hover:text-foreground"
          title="Đóng"
        >
          ✕
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-extrabold mb-1.5 gradient-text flex items-center gap-2">
            ⚡ Nhập nhanh từ vựng
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
            Dán bảng Markdown (dấu <code>|</code>) hoặc copy trực tiếp từ Excel.
            Thứ tự 6 cột chuẩn:{" "}
            <strong className="text-foreground">
              Từ vựng | Phiên âm | Loại từ | Nghĩa | Định nghĩa | Ví dụ
            </strong>
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground-dim">
            <span className="font-semibold text-foreground-muted">Ví dụ Loại từ:</span>
            {["NOUN", "VERB", "ADJ", "ADV", "CỤM TỪ", "STRUCTURE", "IDIOM"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded bg-indigo/10 border border-indigo/20 px-1.5 py-0.5 font-bold text-indigo-light"
                >
                  {tag}
                </span>
              )
            )}
            <span className="ml-2 font-semibold text-foreground-muted">Phiên âm:</span>
            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 font-mono font-bold text-emerald-400">
              /ˌpɜː.sɪˈvɪə.rəns/
            </span>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Ví dụ bảng Markdown 6 cột chuẩn:\n| Perseverance | /ˌpɜː.sɪˈvɪə.rəns/ | NOUN | Sự kiên trì | Continued effort to achieve something | Through perseverance, he succeeded. |\n| Accomplish | /əˈkʌm.plɪʃ/ | VERB | Hoàn thành | To complete successfully | Mission accomplished! |\n| Resilient | /rɪˈzɪl.jəns/ | ADJ | Kiên cường | Able to recover quickly from difficulties | She is very resilient in tough times. |\n| Tag along | /tæɡ əˈlɒŋ/ | CỤM TỪ | Đi cùng | To accompany someone | Do you wanna tag along with us? |\n| Break a leg | /breɪk ə leɡ/ | IDIOM | Chúc may mắn | Used to wish someone good luck | Break a leg on your test! |\n| Be used to | /biː juːzd tuː/ | STRUCTURE | Quen với việc gì | Accustomed to something | I am used to waking up early. |\n\nHoặc copy trực tiếp 6 cột từ Excel (phân cách bằng Tab):\nPerseverance\t/ˌpɜː.sɪˈvɪə.rəns/\tNOUN\tSự kiên trì\tContinued effort...\tThrough perseverance...`}
          className="w-full h-72 p-4 rounded-xl bg-surface/70 border border-border/80 text-foreground text-xs sm:text-sm font-mono outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all resize-none leading-relaxed"
        />

        {/* Live detection preview bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-border/50">
          <div className="text-xs font-semibold text-foreground-muted">
            {parsedPreview.length > 0 ? (
              <span className="text-emerald-400 flex items-center gap-1.5 flex-wrap">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Đã phát hiện <strong>{parsedPreview.length}</strong> thẻ hợp lệ (
                {parsedPreview.filter((p) => p.phonetic).length} có Phiên âm,{" "}
                {parsedPreview.filter((p) => p.partOfSpeech).length} có Loại từ)
              </span>
            ) : (
              <span className="text-foreground-dim">
                Chưa có dữ liệu (hãy dán văn bản vào ô trên)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleParseAndImport}
              disabled={isImporting || parsedPreview.length === 0}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-sakura to-indigo text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md cursor-pointer"
            >
              {isImporting
                ? "⏳ Đang tạo thẻ..."
                : `✅ Tạo danh sách (${parsedPreview.length} thẻ)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
