import Link from "next/link";

interface QuizActionsProps {
  folderId: number;
  total: number;
  newCount: number;
  dueCount: number;
  learnedCount: number;
}

export function QuizActions({ folderId, total, newCount, dueCount, learnedCount }: QuizActionsProps) {
  const hasEnough = total >= 4;
  return (
    <div className="flex flex-col gap-2.5">
      {/* 🌱 Học Mới */}
      {hasEnough && newCount > 0 ? (
        <Link
          href={`/folders/${folderId}/quiz`}
          className="rounded-xl bg-[#23B26D] px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:bg-[#1fa362] shadow-xs active:scale-98"
        >
          🌱 Học Mới ({Math.min(newCount, 5)})
        </Link>
      ) : (
        <div className="rounded-xl border border-dashed border-[#E2E4E9] bg-white px-4 py-2.5 text-center opacity-60">
          <p className="text-xs font-bold text-[#586380]">🌱 Học Mới</p>
          <p className="text-[11px] text-[#939BB4] mt-0.5">
            {!hasEnough
              ? `Cần ít nhất 4 thẻ (hiện có ${total})`
              : "Tất cả thẻ đã được học!"}
          </p>
        </div>
      )}

      {/* 💧/⚡ Ôn Tập */}
      {hasEnough && learnedCount > 0 ? (
        <Link
          href={`/folders/${folderId}/quiz?mode=review`}
          className="rounded-xl bg-[#4255FF] px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:bg-[#3344DD] shadow-xs active:scale-98"
        >
          {dueCount > 0 ? `💧 Ôn Tập (${dueCount} đến hạn)` : `⚡ Ôn Tập Tự Do (${learnedCount})`}
        </Link>
      ) : (
        <div className="rounded-xl border border-dashed border-[#E2E4E9] bg-white px-4 py-2.5 text-center opacity-60">
          <p className="text-xs font-bold text-[#586380]">⚡ Ôn Tập</p>
          <p className="text-[11px] text-[#939BB4] mt-0.5">
            {!hasEnough
              ? `Cần ít nhất 4 thẻ (hiện có ${total})`
              : "Chưa có từ nào đã học"}
          </p>
        </div>
      )}
    </div>
  );
}
