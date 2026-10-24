"use client";

import { useState, useMemo } from "react";
import type { CardInput } from "@/lib/card-utils";

export interface BulkImportProps {
  /** Trả về số thẻ thực sự được tạo (có thể ít hơn số dòng nếu vượt giới hạn thư mục). */
  onImport: (rows: CardInput[]) => Promise<number | void>;
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bỏ qua dòng phân cách Markdown table: |---|---|...
    if (line.match(/^\|?[-:\s|]+\|?$/) && line.includes("-")) continue;

    // Bỏ qua header text nếu chứa các từ khóa tiêu đề cột
    const lineLower = line.toLowerCase();
    if (
      (lineLower.includes("word") || lineLower.includes("từ vựng")) &&
      (lineLower.includes("translation") || lineLower.includes("nghĩa"))
    ) {
      continue;
    }

    let cols: string[] = [];

    if (line.includes("|")) {
      // Định dạng Markdown Table
      const rawCols = line.split("|").map((c) => c.trim());
      // Nếu bắt đầu hoặc kết thúc bằng | thì bỏ cột trống ở 2 đầu
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
    let partOfSpeech = "";
    let translation = "";
    let definition = "";
    let example = "";

    if (cols.length >= 5) {
      word = cols[0];

      // Nhận diện vị trí Loại từ thông minh:
      if (isPos(cols[1])) {
        // Trường hợp 1: Từ vựng | Loại từ | Nghĩa | Định nghĩa | Ví dụ
        partOfSpeech = cols[1];
        translation = cols[2];
        definition = cols[3] || "";
        example = cols[4] || "";
      } else if (isPos(cols[2])) {
        // Trường hợp 2: Từ vựng | Nghĩa | Loại từ | Định nghĩa | Ví dụ
        translation = cols[1];
        partOfSpeech = cols[2];
        definition = cols[3] || "";
        example = cols[4] || "";
      } else if (isPos(cols[4])) {
        // Trường hợp 3: Từ vựng | Nghĩa | Định nghĩa | Ví dụ | Loại từ
        translation = cols[1];
        definition = cols[2] || "";
        example = cols[3] || "";
        partOfSpeech = cols[4];
      } else {
        // Mặc định chuẩn: Từ vựng | Loại từ | Nghĩa | Định nghĩa | Ví dụ
        partOfSpeech = cols[1];
        translation = cols[2];
        definition = cols[3] || "";
        example = cols[4] || "";
      }
    } else if (cols.length === 4) {
      word = cols[0];
      if (isPos(cols[1])) {
        // Từ vựng | Loại từ | Nghĩa | Định nghĩa/Ví dụ
        partOfSpeech = cols[1];
        translation = cols[2];
        definition = cols[3];
      } else if (isPos(cols[2])) {
        // Từ vựng | Nghĩa | Loại từ | Ví dụ
        translation = cols[1];
        partOfSpeech = cols[2];
        definition = cols[3];
      } else {
        // Chuẩn cũ 4 cột: Từ vựng | Nghĩa | Định nghĩa | Ví dụ
        translation = cols[1];
        definition = cols[2];
        example = cols[3];
      }
    } else if (cols.length === 3) {
      word = cols[0];
      if (isPos(cols[1])) {
        partOfSpeech = cols[1];
        translation = cols[2];
      } else if (isPos(cols[2])) {
        translation = cols[1];
        partOfSpeech = cols[2];
      } else {
        translation = cols[1];
        definition = cols[2];
      }
    } else if (cols.length === 2) {
      word = cols[0];
      translation = cols[1];
    }

    if (word && translation) {
      result.push({
        word,
        translation,
        partOfSpeech: partOfSpeech ? normalizePos(partOfSpeech) : undefined,
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
            Cột theo thứ tự:{" "}
            <strong className="text-foreground">
              Từ vựng | Loại từ | Nghĩa | Định nghĩa | Ví dụ
            </strong>{" "}
            (hoặc{" "}
            <strong className="text-foreground">
              Từ vựng | Nghĩa | Loại từ | Định nghĩa | Ví dụ
            </strong>
            ).
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-foreground-dim">
            <span className="font-semibold text-foreground-muted">Loại từ ví dụ:</span>
            {["NOUN", "VERB", "ADJ", "ADV", "CỤM TỪ", "STRUCTURE", "PHRASE", "IDIOM"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded bg-indigo/10 border border-indigo/20 px-1.5 py-0.5 font-bold text-indigo-light"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Ví dụ bảng Markdown (5 cột):\n| Perseverance | NOUN | Sự kiên trì | Continued effort to achieve something | Through perseverance, he succeeded. |\n| Tag along | CỤM TỪ | Đi cùng | To accompany someone | Do you wanna tag along? |\n| Resilient | ADJ | Kiên cường | Able to recover quickly | She is a very resilient person. |\n| Break a leg | IDIOM | Chúc may mắn | Used to wish good luck | Break a leg at your interview! |\n| Be used to | STRUCTURE | Quen với việc gì | Accustomed to something | I am used to waking up early. |\n\nHoặc copy/paste trực tiếp từ Excel (các cột cách nhau bởi phím Tab):\nPerseverance\tNOUN\tSự kiên trì\tContinued effort...\tThrough perseverance...`}
          className="w-full h-72 p-4 rounded-xl bg-surface/70 border border-border/80 text-foreground text-xs sm:text-sm font-mono outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all resize-none leading-relaxed"
        />

        {/* Live detection preview bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-border/50">
          <div className="text-xs font-semibold text-foreground-muted">
            {parsedPreview.length > 0 ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Đã phát hiện <strong>{parsedPreview.length}</strong> thẻ hợp lệ (
                {parsedPreview.filter((p) => p.partOfSpeech).length} thẻ có Loại từ)
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
