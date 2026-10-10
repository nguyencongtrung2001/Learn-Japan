"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export interface ExcelImportProps {
  onImport: (rows: { word: string; phonetic?: string; definition?: string; translation: string; example?: string; imageUrl?: string }[]) => Promise<void>;
}

export default function ExcelImport({ onImport }: ExcelImportProps) {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Bỏ qua header
      const dataRows = rows.slice(1);
      
      const importedCards = dataRows.map((row) => ({
        word: row[0]?.toString() || "",
        translation: row[1]?.toString() || "",
        phonetic: row[2]?.toString() || "",
        definition: row[3]?.toString() || "",
        example: row[4]?.toString() || "",
        imageUrl: row[5]?.toString() || "",
      })).filter((c) => c.word && c.translation);

      if (importedCards.length > 0) {
        await onImport(importedCards);
        alert(`Đã import thành công ${importedCards.length} thẻ!`);
      } else {
        alert("Không tìm thấy dữ liệu hợp lệ trong file Excel. Vui lòng kiểm tra lại cột.");
      }
    } catch (error) {
      console.error("Lỗi khi import Excel:", error);
      alert("Đã xảy ra lỗi khi đọc file Excel.");
    } finally {
      setIsImporting(false);
      // Reset input
      if (e.target) e.target.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Word (Từ vựng) (*)",
      "Translation (Nghĩa) (*)",
      "Phonetic (Phiên âm)",
      "Definition (Định nghĩa)",
      "Example (Ví dụ)",
      "Image URL (Link ảnh)"
    ];
    
    const sampleRow = [
      "apple",
      "quả táo",
      "/ˈæp.əl/",
      "a round fruit with red or green skin and a whitish interior",
      "I eat an apple every day.",
      ""
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    
    ws["!cols"] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 40 },
      { wch: 40 },
      { wch: 30 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tu Vung Tieng Anh");

    XLSX.writeFile(wb, "mau_nhap_tu_vung_tieng_anh.xlsx");
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={handleDownloadTemplate}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald/10 text-emerald hover:bg-emerald/20 transition-colors cursor-pointer"
      >
        📥 Tải file mẫu
      </button>
      
      <div className="relative">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={isImporting}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          title="Chọn file Excel"
        />
        <button
          disabled={isImporting}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo/10 text-indigo-light hover:bg-indigo/20 transition-colors pointer-events-none"
        >
          {isImporting ? "⏳ Đang xử lý..." : "⬆️ Nhập từ Excel"}
        </button>
      </div>
    </div>
  );
}
