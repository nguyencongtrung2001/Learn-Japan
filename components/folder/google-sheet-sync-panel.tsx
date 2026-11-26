"use client";

import { useState } from "react";
import type { Folder } from "@/db/schema";
import type { CardListItem } from "@/lib/card-utils";
import {
  syncFolderWithGoogleSheet,
  exportFolderCardsToCsv,
  type SyncStats,
} from "@/actions/google-sheet-actions";

interface GoogleSheetSyncPanelProps {
  folder: Folder;
  onClose: () => void;
  onSyncSuccess: (newCards: CardListItem[], updatedSheetUrl?: string, lastSynced?: string) => void;
}

export function GoogleSheetSyncPanel({
  folder,
  onClose,
  onSyncSuccess,
}: GoogleSheetSyncPanelProps) {
  const [sheetUrl, setSheetUrl] = useState(folder.googleSheetUrl ?? "");
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [syncedSheetName, setSyncedSheetName] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const isJapanese = folder.language === "japanese";

  // Thực hiện đồng bộ từ Google Sheet
  const handleSync = async () => {
    const trimmed = sheetUrl.trim();
    if (!trimmed) {
      setError("Vui lòng dán link Google Sheet trước khi đồng bộ.");
      return;
    }

    setSyncing(true);
    setError(null);
    setStats(null);
    setSyncedSheetName(null);

    try {
      const res = await syncFolderWithGoogleSheet(folder.id, trimmed);
      if (!res.success || !res.stats) {
        setError(res.error || "Không thể đồng bộ từ Google Sheet.");
      } else {
        setStats(res.stats);
        if (res.sheetName) {
          setSyncedSheetName(res.sheetName);
        }
        if (res.updatedCards) {
          onSyncSuccess(res.updatedCards, res.sheetUrl, res.lastSyncedAt);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối khi đồng bộ.");
    } finally {
      setSyncing(false);
    }
  };

  // Tải CSV mẫu có sẵn ID của các thẻ trong thư mục này
  const handleExportCsvWithIds = async () => {
    try {
      setExporting(true);
      const csvContent = await exportFolderCardsToCsv(folder.id);
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folder.name.replace(/\s+/g, "_")}_cards_with_id.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Lỗi khi xuất file CSV: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
    }
  };

  // Sao chép dòng header 11 cột vào clipboard
  const handleCopyHeaders = () => {
    const headerRow =
      "ID\tTừ vựng (Kana)\tKanji\tFurigana\tRomaji\tLoại từ\tNghĩa\tNgữ cảnh\tVí dụ\tCó dịch nghĩa\tHình ảnh";
    navigator.clipboard.writeText(headerRow).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    });
  };

  return (
    <div className="animate-fade-in relative mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-white p-5 sm:p-7 shadow-lg">
      {/* Nút đóng */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#586380] hover:bg-emerald-50 hover:text-[#1A1D28] transition-all cursor-pointer z-10"
        title="Đóng bảng đồng bộ"
        aria-label="Đóng bảng đồng bộ"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="mb-4 pr-10">
        <h3 className="text-lg font-bold text-[#1A1D28] flex items-center gap-2">
          <span>🔄</span> Đồng Bộ Từ Vựng Với Google Sheet
        </h3>
        <p className="text-xs text-[#586380] mt-1 leading-relaxed">
          Quản lý từ vựng trực tiếp trên Google Sheets. Mỗi khi có thay đổi (thêm thẻ mới hoặc sửa nghĩa, câu ví dụ, chữ Hán...), chỉ cần bấm nút đồng bộ thì website sẽ tự động cập nhật mà không làm mất tiến độ học!
        </p>
      </div>

      {/* Cấu trúc 11 cột hiển thị trực quan */}
      <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <span>📋</span> Cấu trúc 11 cột chuẩn trên Google Sheet:
          </span>
          <button
            type="button"
            onClick={handleCopyHeaders}
            className="text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            {copyFeedback ? "✅ Đã copy dòng tiêu đề!" : "📋 Copy dòng tiêu đề"}
          </button>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-950">
            <span className="rounded bg-emerald-200/80 px-2 py-0.5 border border-emerald-300">1. ID</span>
            <span>|</span>
            <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">2. {isJapanese ? "Từ vựng (Kana)" : "Từ vựng"}</span>
            <span>|</span>
            <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">3. Kanji</span>
            <span>|</span>
            <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">4. Furigana</span>
            <span>|</span>
            <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">5. Romaji</span>
            <span>|</span>
            <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">6. Loại từ</span>
            <span>|</span>
            <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">7. Nghĩa</span>
            <span>|</span>
            <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">8. Ngữ cảnh</span>
            <span>|</span>
            <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">9. Ví dụ</span>
            <span>|</span>
            <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">10. Có dịch nghĩa</span>
            <span>|</span>
            <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">11. Hình ảnh</span>
          </div>
        </div>

        <p className="text-[11px] text-emerald-800/90 mt-2 leading-relaxed">
          💡 <strong>Quy tắc đối chiếu:</strong> Cột <strong>ID</strong> dùng để nhận biết thẻ cũ cần chỉnh sửa. Nếu bạn thêm từ mới, hãy để trống cột ID!
        </p>
      </div>

      {/* Input Link Google Sheet */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#586380] mb-1.5" htmlFor="sheet-url-input">
            🔗 Đường dẫn Google Sheet (Đã bật quyền xem)
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              id="sheet-url-input"
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0.../edit"
              disabled={syncing}
              className="flex-1 rounded-xl border border-[#E2E4E9] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono text-[#1A1D28] outline-none transition-all placeholder:text-[#939BB4] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing || !sheetUrl.trim()}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:from-emerald-700 hover:to-teal-700 active:scale-98 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Đang đồng bộ...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Đồng Bộ Ngay</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hướng dẫn quyền truy cập Google Sheet */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#586380] pt-0.5">
          <span className="flex items-center gap-1 text-amber-700">
            <span>⚠️</span> File Sheet phải được bật: <strong>Chia sẻ → Bất kỳ ai có đường liên kết đều có thể xem</strong> (Viewer).
          </span>

          {folder.lastSyncedAt && (
            <span className="text-[#939BB4] font-medium">
              Lần đồng bộ gần nhất:{" "}
              <strong className="text-[#1A1D28]">
                {new Date(folder.lastSyncedAt).toLocaleString("vi-VN")}
              </strong>
            </span>
          )}
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium flex items-start gap-2 animate-fade-in">
            <span className="shrink-0 mt-0.5">❌</span>
            <div className="flex-1 leading-relaxed">{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Thông báo kết quả đồng bộ thành công */}
        {stats && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 text-xs animate-fade-in-up">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5 text-sm">
              <span>🎉</span> Đồng bộ thành công với Google Sheet!
            </div>
            {syncedSheetName && (
              <div className="text-[11px] text-emerald-800 font-medium mb-2.5 flex items-center gap-1.5">
                <span>📑</span>
                <span>Trang tính:</span>
                <span className="font-bold bg-white/90 px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-900 shadow-2xs">
                  {syncedSheetName}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-bold">
              <div className="bg-white rounded-lg p-2 border border-emerald-200 shadow-2xs">
                <div className="text-emerald-700 text-base">+{stats.added}</div>
                <div className="text-[10px] text-[#586380] uppercase tracking-wider mt-0.5">Thêm mới</div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-emerald-200 shadow-2xs">
                <div className="text-blue-600 text-base">✏️ {stats.updated}</div>
                <div className="text-[10px] text-[#586380] uppercase tracking-wider mt-0.5">Cập nhật</div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-emerald-200 shadow-2xs">
                <div className="text-gray-600 text-base">⏸️ {stats.unchanged}</div>
                <div className="text-[10px] text-[#586380] uppercase tracking-wider mt-0.5">Giữ nguyên</div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-emerald-200 shadow-2xs">
                <div className="text-amber-600 text-base">⏩ {stats.skipped}</div>
                <div className="text-[10px] text-[#586380] uppercase tracking-wider mt-0.5">Bỏ qua (rỗng)</div>
              </div>
            </div>
          </div>
        )}

        {/* Tiện ích: Tải file CSV hiện tại có sẵn ID để đưa lên Sheet */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E2E4E9]">
          <button
            type="button"
            onClick={handleExportCsvWithIds}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E4E9] bg-white px-3.5 py-2 text-xs font-bold text-[#1A1D28] hover:bg-[#EDEFF4] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Tải file CSV gồm toàn bộ từ vựng hiện có kèm mã ID để nạp vào Google Sheet"
          >
            <span>📥</span> {exporting ? "Đang chuẩn bị file..." : "Tải CSV danh sách hiện tại (kèm ID)"}
          </button>

          <span className="text-[11px] text-[#586380]">
            Mẹo: Tải file trên về import vào Google Sheet để có sẵn các cột chuẩn và ID thẻ!
          </span>
        </div>
      </div>
    </div>
  );
}
