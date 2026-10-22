import Link from "next/link";

interface QuizActionsProps {
  folderId: number;
  total: number;
  newCount: number;
  dueCount: number;
}

export function QuizActions({ folderId, total, newCount, dueCount }: QuizActionsProps) {
  const href = `/folders/${folderId}/quiz`;
  return (
    <div className="flex flex-col gap-3">
      {newCount > 0 && total >= 4 && (
        <Link
          href={href}
          className="btn-shine rounded-2xl bg-gradient-to-r from-emerald to-teal-500 px-6 py-3 text-center font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald/30 active:scale-95"
        >
          🌱 Học Mới ({Math.min(newCount, 5)})
        </Link>
      )}
      {dueCount > 0 && (
        <Link
          href={href}
          className="btn-shine rounded-2xl bg-gradient-to-r from-sakura to-indigo px-6 py-3 text-center font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-sakura/30 active:scale-95"
        >
          💧 Ôn Tập ({dueCount})
        </Link>
      )}
    </div>
  );
}
