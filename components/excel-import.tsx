"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

interface ExcelRow {
  kanji?: string;
  kana?: string;
  romaji?: string;
  term?: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  usage?: string;
  imageUrl?: string;
}

interface ExcelImportProps {
  language?: string;
  onImport: (rows: ExcelRow[]) => Promise<void>;
}

const TEMPLATE_COLUMNS_JP = [
  { key: "kanji", label: "Kanji", example: "食べる", required: false },
  { key: "kana", label: "Kana", example: "たべる", required: true },
  { key: "romaji", label: "Romaji", example: "taberu", required: true },
  { key: "meaning", label: "Nghĩa", example: "Ăn", required: true },
  { key: "usage", label: "Cách dùng", example: "ごはんを食べる", required: false },
  { key: "imageUrl", label: "Link ảnh", example: "https://...", required: false },
];

const TEMPLATE_COLUMNS_EN = [
  { key: "term", label: "Từ vựng", example: "apple", required: true },
  { key: "phonetic", label: "Phiên âm", example: "/ˈæpl/", required: false },
  { key: "partOfSpeech", label: "Từ loại", example: "n", required: false },
  { key: "meaning", label: "Nghĩa", example: "Quả táo", required: true },
  { key: "usage", label: "Cách dùng", example: "I eat an apple", required: false },
  { key: "imageUrl", label: "Link ảnh", example: "https://...", required: false },
];

export default function ExcelImport({ language = "japanese", onImport }: ExcelImportProps) {
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState<ExcelRow[]>([]);
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");
    setPreview([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

        if (jsonData.length === 0) {
          setError("File Excel không có dữ liệu.");
          return;
        }

        // Map columns (case-insensitive, support both Vietnamese and English headers)
        const headerMap: Record<string, string> = {
          kanji: "kanji",
          kana: "kana",
          romaji: "romaji",
          term: "term",
          "từ vựng": "term",
          "tu vung": "term",
          phonetic: "phonetic",
          "phiên âm": "phonetic",
          "phien am": "phonetic",
          partofspeech: "partOfSpeech",
          "từ loại": "partOfSpeech",
          "tu loai": "partOfSpeech",
          meaning: "meaning",
          "nghĩa": "meaning",
          "nghia": "meaning",
          usage: "usage",
          "cách dùng": "usage",
          "cach dung": "usage",
          "ví dụ": "usage",
          "vi du": "usage",
          imageurl: "imageUrl",
          "link ảnh": "imageUrl",
          "link anh": "imageUrl",
          image: "imageUrl",
        };

        const rows: ExcelRow[] = [];
        let skippedCount = 0;

        for (const row of jsonData) {
          const mapped: Record<string, string> = {};
          for (const [key, value] of Object.entries(row)) {
            const normalizedKey = key.toLowerCase().trim();
            const mappedKey = headerMap[normalizedKey];
            if (mappedKey) {
              mapped[mappedKey] = String(value).trim();
            }
          }

          // Validate required fields
          if (language === "english") {
            if (mapped.term && mapped.meaning) {
              rows.push({
                term: mapped.term,
                phonetic: mapped.phonetic || undefined,
                partOfSpeech: mapped.partOfSpeech || undefined,
                meaning: mapped.meaning,
                usage: mapped.usage || undefined,
                imageUrl: mapped.imageUrl || undefined,
              });
            } else {
              skippedCount++;
            }
          } else {
            if (mapped.kana && mapped.romaji && mapped.meaning) {
              rows.push({
                kanji: mapped.kanji || undefined,
                kana: mapped.kana,
                romaji: mapped.romaji,
                meaning: mapped.meaning,
                usage: mapped.usage || undefined,
                imageUrl: mapped.imageUrl || undefined,
              });
            } else {
              skippedCount++;
            }
          }
        }

        if (rows.length === 0) {
          setError(
            language === "english"
              ? `Không tìm thấy dữ liệu hợp lệ. Vui lòng đảm bảo file có các cột: Từ vựng, Nghĩa. (${skippedCount} dòng bị bỏ qua)`
              : `Không tìm thấy dữ liệu hợp lệ. Vui lòng đảm bảo file có các cột: Kana, Romaji, Nghĩa. (${skippedCount} dòng bị bỏ qua)`
          );
          return;
        }

        if (skippedCount > 0) {
          setError(`⚠️ ${skippedCount} dòng thiếu dữ liệu bắt buộc đã bị bỏ qua.`);
        }

        setPreview(rows);
      } catch {
        setError("Không thể đọc file. Vui lòng kiểm tra định dạng file Excel (.xlsx, .xls).");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setIsImporting(true);
    try {
      await onImport(preview);
      setShowModal(false);
      setPreview([]);
      setFileName("");
      setError("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Lỗi khi import. Vui lòng thử lại.");
    }
    setIsImporting(false);
  };

  const downloadTemplate = () => {
    const templateData = language === "english"
      ? [
          { "Từ vựng": "apple", "Phiên âm": "/ˈæpl/", "Từ loại": "n", "Nghĩa": "Quả táo", "Cách dùng": "I eat an apple", "Link ảnh": "" },
          { "Từ vựng": "run", "Phiên âm": "/rʌn/", "Từ loại": "v", "Nghĩa": "Chạy", "Cách dùng": "He runs fast", "Link ảnh": "" },
        ]
      : [
          { Kanji: "食べる", Kana: "たべる", Romaji: "taberu", "Nghĩa": "Ăn", "Cách dùng": "ごはんを食べる (Ăn cơm)", "Link ảnh": "" },
          { Kanji: "飲む", Kana: "のむ", Romaji: "nomu", "Nghĩa": "Uống", "Cách dùng": "水を飲む (Uống nước)", "Link ảnh": "" },
          { Kanji: "", Kana: "おはよう", Romaji: "ohayou", "Nghĩa": "Chào buổi sáng", "Cách dùng": "おはようございます", "Link ảnh": "" },
        ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    // Set column widths
    ws["!cols"] = [
      { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 30 }, { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Từ vựng");
    XLSX.writeFile(wb, "mau_tu_vung.xlsx");
  };

  const columns = language === "english" ? TEMPLATE_COLUMNS_EN : TEMPLATE_COLUMNS_JP;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-5 py-2.5 rounded-xl border border-border text-foreground-muted font-medium
                   hover:bg-surface-hover hover:text-foreground transition-all duration-200 cursor-pointer text-sm"
      >
        📥 Import Excel
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text">📥 Import từ Excel</h2>
              <button
                onClick={() => { setShowModal(false); setPreview([]); setError(""); }}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors cursor-pointer text-foreground-muted"
              >
                ✕
              </button>
            </div>

            {/* Template format */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground-muted mb-3">
                📋 Định dạng file Excel yêu cầu:
              </h3>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-hover">
                      {columns.map((col) => (
                        <th key={col.key} className="px-3 py-2 text-left font-medium text-foreground-muted whitespace-nowrap">
                          {col.label}
                          {col.required && <span className="text-rose ml-0.5">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/50">
                      {columns.map((col) => (
                        <td key={col.key} className="px-3 py-2 text-foreground-dim kana-display whitespace-nowrap">
                          {col.example}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-foreground-dim mt-2">
                <span className="text-rose">*</span> = Bắt buộc. Các cột khác là tùy chọn. Tên cột hỗ trợ cả tiếng Anh và tiếng Việt.
              </p>
            </div>

            {/* Download template + Upload */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={downloadTemplate}
                className="flex-1 py-2.5 px-4 rounded-xl border border-emerald/30 text-emerald hover:bg-emerald/10
                           transition-colors cursor-pointer text-sm font-medium"
              >
                📄 Tải file mẫu (.xlsx)
              </button>
              <label className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sakura to-indigo text-white
                                text-center cursor-pointer hover:shadow-lg hover:shadow-sakura/25 hover:scale-[1.02]
                                transition-all duration-200 text-sm font-semibold">
                📂 Chọn file Excel
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>
            </div>

            {fileName && (
              <p className="text-sm text-foreground-muted mb-4">
                📎 File: <span className="font-medium text-foreground">{fileName}</span>
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-rose/10 border border-rose/20 text-rose text-sm mb-4 animate-fade-in">
                {error}
              </div>
            )}

            {/* Preview */}
            {preview.length > 0 && (
              <div className="mb-6 animate-fade-in">
                <h3 className="text-sm font-semibold text-foreground-muted mb-3">
                  👁️ Xem trước ({preview.length} từ vựng):
                </h3>
                <div className="overflow-x-auto rounded-xl border border-border max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0">
                      <tr className="bg-surface-hover">
                        <th className="px-3 py-2 text-left text-foreground-muted">#</th>
                        {language === "english" ? (
                          <>
                            <th className="px-3 py-2 text-left text-foreground-muted">Từ vựng</th>
                            <th className="px-3 py-2 text-left text-foreground-muted">Phiên âm</th>
                            <th className="px-3 py-2 text-left text-foreground-muted">Từ loại</th>
                          </>
                        ) : (
                          <>
                            <th className="px-3 py-2 text-left text-foreground-muted">Kanji</th>
                            <th className="px-3 py-2 text-left text-foreground-muted">Kana</th>
                            <th className="px-3 py-2 text-left text-foreground-muted">Romaji</th>
                          </>
                        )}
                        <th className="px-3 py-2 text-left text-foreground-muted">Nghĩa</th>
                        <th className="px-3 py-2 text-left text-foreground-muted">Cách dùng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-border/50 hover:bg-surface-hover/50">
                          <td className="px-3 py-1.5 text-foreground-dim">{i + 1}</td>
                          {language === "english" ? (
                            <>
                              <td className="px-3 py-1.5 font-bold">{row.term}</td>
                              <td className="px-3 py-1.5 text-indigo-light">{row.phonetic || "—"}</td>
                              <td className="px-3 py-1.5 italic text-foreground-dim">{row.partOfSpeech || "—"}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-1.5 kana-display">{row.kanji || "—"}</td>
                              <td className="px-3 py-1.5 kana-display text-indigo-light">{row.kana}</td>
                              <td className="px-3 py-1.5">{row.romaji}</td>
                            </>
                          )}
                          <td className="px-3 py-1.5">{row.meaning}</td>
                          <td className="px-3 py-1.5 text-foreground-dim text-xs">{row.usage || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Import button */}
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full mt-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald to-teal-500 text-white
                             hover:shadow-lg hover:shadow-emerald/25 hover:scale-[1.02] active:scale-[0.98]
                             transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting
                    ? `⏳ Đang import ${preview.length} từ vựng...`
                    : `✅ Import ${preview.length} từ vựng`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
