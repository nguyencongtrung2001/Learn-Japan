"use client";

import { useState } from "react";
import type { CardInput } from "@/lib/card-utils";

export interface BulkImportProps {
  /** Trả về số thẻ thực sự được tạo (có thể ít hơn số dòng nếu vượt giới hạn thư mục). */
  onImport: (rows: CardInput[]) => Promise<number | void>;
}

export default function BulkImport({ onImport }: BulkImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleParseAndImport = async () => {
    if (!text.trim()) return;
    setIsImporting(true);

    try {
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      const importedCards: CardInput[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Bỏ qua dòng format markdown table header dạng |---|---|
        if (line.match(/^\|?[-:]+\|/)) continue;

        // Bỏ qua header text nếu tìm thấy "word" và "translation"
        if (line.toLowerCase().includes("word") && line.toLowerCase().includes("translation")) continue;

        let word = "";
        let translation = "";
        let definition = "";
        let example = "";

        if (line.includes("|")) {
          // Parse Markdown table format
          // Vd: | **Word** | Nghĩa | Definition | *Example* |
          const cols = line.split("|").map(c => c.trim());
          
          // Thường cột 0 là rỗng do chuỗi bắt đầu bằng |, nên dữ liệu từ cột 1
          const startIndex = line.startsWith("|") ? 1 : 0;
          
          word = cols[startIndex] || "";
          translation = cols[startIndex + 1] || "";
          definition = cols[startIndex + 2] || "";
          example = cols[startIndex + 3] || "";
        } else if (line.includes("\t")) {
          // Parse TSV (nếu dán trực tiếp từ Excel)
          const cols = line.split("\t").map(c => c.trim());
          word = cols[0] || "";
          translation = cols[1] || "";
          definition = cols[2] || "";
          example = cols[3] || "";
        } else {
          continue; // Bỏ qua nếu không phải format bảng
        }

        // Clean up markdown formatting like ** or *
        word = word.replace(/\*\*/g, "").replace(/\*/g, "").trim();
        translation = translation.replace(/\*\*/g, "").replace(/\*/g, "").trim();
        definition = definition.replace(/\*\*/g, "").replace(/\*/g, "").trim();
        example = example.replace(/\*\*/g, "").replace(/\*/g, "").trim();

        if (word && translation) {
          importedCards.push({
            word,
            translation,
            definition,
            example
          });
        }
      }

      if (importedCards.length > 0) {
        const created = await onImport(importedCards);
        const createdCount = typeof created === "number" ? created : importedCards.length;
        const skipped = importedCards.length - createdCount;
        alert(
          `Đã nhập nhanh thành công ${createdCount} thẻ!` +
            (skipped > 0 ? ` (${skipped} thẻ bị bỏ qua do đã đạt giới hạn thư mục)` : "")
        );
        setText("");
        setIsOpen(false);
      } else {
        alert("Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại cấu trúc (sử dụng dấu | hoặc dán từ Excel).");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-3xl p-6 shadow-2xl relative animate-fade-in-up">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-hover transition-colors text-foreground-muted hover:text-foreground"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2 gradient-text">⚡ Nhập nhanh từ vựng</h2>
        <p className="text-sm text-foreground-muted mb-4">
          Dán bảng Markdown (dấu <code>|</code>) hoặc copy trực tiếp từ Excel. Cột theo thứ tự: <strong>Từ vựng | Nghĩa | Định nghĩa | Ví dụ</strong>.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Ví dụ:\n| Do you wanna tag along? | Bạn có muốn đi cùng không? | An informal way to invite... | We're going to the beach... |\n| You got it backward. | Bạn hiểu ngược rồi. | You misunderstood... | No, you got it backward... |`}
          className="w-full h-64 p-4 rounded-xl bg-surface border border-border text-foreground text-sm font-mono outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/30 transition-all mb-4 resize-none"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2.5 rounded-xl border border-border text-foreground-muted font-medium hover:bg-surface-hover hover:text-foreground transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleParseAndImport}
            disabled={isImporting || !text.trim()}
            className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-sakura to-indigo text-white hover:scale-[1.02] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isImporting ? "⏳ Đang tạo thẻ..." : "✅ Tạo danh sách"}
          </button>
        </div>
      </div>
    </div>
  );
}
