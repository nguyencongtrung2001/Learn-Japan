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
        // Exclude the source folder from the list
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
    <div className="rounded-xl border border-indigo/20 bg-surface p-3 space-y-3">
      <p className="text-xs font-semibold text-foreground-muted">
        Đã chọn <span className="text-indigo-light">{selectedCards.length}</span> thẻ
      </p>

      Danh sách từ đã chọn
      <div className="flex flex-wrap gap-1">
        {selectedCards.map((c) => (
          <span
            key={c.id}
            className="rounded-md bg-indigo/10 px-2 py-0.5 text-[11px] font-bold text-indigo-light"
          >
            {c.word} 123
          </span>
        ))}
      </div>

      {/* Chọn folder đích */}
      <select
        value={targetFolderId ?? ""}
        onChange={(e) => setTargetFolderId(Number(e.target.value) || null)}
        className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground outline-none focus:border-indigo"
      >
        <option value="">— Chọn thư mục đích —</option>
        {folders.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-xs font-semibold text-rose">{error}</p>
      )}

      <button
        type="button"
        onClick={handleTransfer}
        disabled={loading || !targetFolderId}
        className="w-full cursor-pointer rounded-xl bg-indigo px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-indigo-light disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Đang chuyển..." : `🚀 Chuyển nhanh ${selectedCards.length} thẻ`}
      </button>
    </div>
  );
}
