import Link from "next/link";

interface QuizActionsProps {
  folderId: number;
  total: number;
  newCount: number;
  dueCount: number;
}

export function QuizActions({ folderId, total, newCount, dueCount }: QuizActionsProps) {
  const href = `/folders/${folderId}/quiz`;
  const hasEnough = total >= 4;
  return (
    <div className="flex flex-col gap-3">

      {/* 🌱 Học Mới */}
      {hasEnough && newCount > 0 ? (
        <Link
          href={href}
          className="btn-shine rounded-2xl bg-gradient-to-r from-emerald to-teal-500 px-6 py-3 text-center font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald/30 active:scale-95"
        >
          🌱 Học Mới ({Math.min(newCount, 5)})
        </Link>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-emerald/20 px-6 py-3 text-center opacity-50">
          <p className="text-sm font-bold text-emerald">🌱 Học Mới</p>
          <p className="text-xs text-foreground-muted mt-0.5">
            {!hasEnough
              ? `Cần ít nhất 4 thẻ (hiện có ${total})`
              : "Tất cả thẻ đã được học!"}
          </p>
        </div>
      )}

      {/* 💧 Ôn Tập */}
      {dueCount > 0 ? (
        <Link
          href={href}
          className="btn-shine rounded-2xl bg-gradient-to-r from-sakura to-indigo px-6 py-3 text-center font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-sakura/30 active:scale-95"
        >
          💧 Ôn Tập ({dueCount})
        </Link>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-sakura/20 px-6 py-3 text-center opacity-50">
          <p className="text-sm font-bold text-sakura-light">💧 Ôn Tập</p>
          <p className="text-xs text-foreground-muted mt-0.5">Chưa có thẻ nào cần ôn</p>
        </div>
      )}
    </div>
  );
}
