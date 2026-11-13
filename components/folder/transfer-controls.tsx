"use client";

import { useEffect, useState } from "react";
import { getFolders } from "@/actions/folder-actions";
import { moveCards } from "@/actions/card-actions";
import type { Folder } from "@/db/schema";
import type { CardListItem } from "@/lib/card-utils";

interface TransferControlsProps {
  sourceFolderId: number;
  selectedCards: CardListItem[];
  onTransferSuccess: (movedIds: number[]) => void;
}

export function TransferControls({
  sourceFolderId,
  selectedCards,
  onTransferSuccess,
}: TransferControlsProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all folders on mount
  useEffect(() => {
    getFolders().then((res) => {
      if (res.success && res.data) {
        setFolders(res.data.filter((f) => f.id !== sourceFolderId));
      }
    });
  }, [sourceFolderId]);

  const handleTransfer = async () => {
    if (!targetFolderId) {
      setError("Vui lòng chọn thư mục đích.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cardIds = selectedCards.map((c) => c.id);
      const result = await moveCards(sourceFolderId, targetFolderId, cardIds);
      if (result.success) {
        onTransferSuccess(result.movedIds);
      } else {
        setError(result.error || "Có lỗi xảy ra khi chuyển thẻ.");
      }
    } catch (err) {
      console.error("Transfer error:", err);
      setError("Có lỗi xảy ra khi chuyển thẻ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#E2E4E9] bg-white p-3 space-y-2.5 shadow-xs">
      <p className="text-xs font-semibold text-[#586380]">
        Đã chọn <span className="font-bold text-[#4255FF]">{selectedCards.length}</span> thẻ
      </p>

      {/* Danh sách từ đã chọn */}
      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
        {selectedCards.map((c) => (
          <span
            key={c.id}
            className="rounded-md bg-[#EDEFF4] px-2 py-0.5 text-[11px] font-bold text-[#1A1D28]"
          >
            {c.word}
          </span>
        ))}
      </div>

      {/* Chọn folder đích */}
      <select
        value={targetFolderId ?? ""}
        onChange={(e) => setTargetFolderId(Number(e.target.value) || null)}
        className="w-full rounded-lg border border-[#E2E4E9] bg-white px-2.5 py-1.5 text-xs text-[#1A1D28] outline-none focus:border-[#4255FF]"
      >
        <option value="">— Chọn thư mục đích —</option>
        {folders.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-xs font-semibold text-red-500">{error}</p>
      )}

      <button
        type="button"
        onClick={handleTransfer}
        disabled={loading || !targetFolderId}
        className="w-full cursor-pointer rounded-lg bg-[#4255FF] px-3 py-2 text-xs font-bold text-white transition-all hover:bg-[#3344DD] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Đang chuyển..." : `🚀 Chuyển ${selectedCards.length} thẻ`}
      </button>
    </div>
  );
}
