import { LimitProgress } from "./limit-progress";
import type { Folder } from "@/db/schema";

interface FolderInfoCardProps {
  folder: Folder;
  total: number;
  newCount: number;
  dueCount: number;
  editing: boolean;
}

export function FolderInfoCard({
  folder,
  total,
  newCount,
  dueCount,
  editing,
}: FolderInfoCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E2E4E9] bg-white p-5 shadow-xs">
      <div className="relative z-10">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="text-2xl shrink-0">📂</span>
          <h1 className="min-w-0 break-words text-xl font-bold tracking-tight text-[#1A1D28]">
            {folder.name}
          </h1>
        </div>

        {folder.description && !editing && (
          <p className="mb-3.5 text-xs sm:text-sm leading-relaxed text-[#586380]">
            {folder.description}
          </p>
        )}

        {folder.maxCards && !editing && <LimitProgress current={total} max={folder.maxCards} />}

        <div className="flex flex-wrap items-center gap-1.5">
          {folder.language === "japanese" ? (
            <span className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">
              🇯🇵 Tiếng Nhật
            </span>
          ) : (
            <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#4255FF]">
              🇬🇧 Tiếng Anh
            </span>
          )}
          {folder.maxCards ? (
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              📊 {total}/{folder.maxCards}
            </span>
          ) : (
            <span className="rounded-lg border border-[#E2E4E9] bg-[#F6F7FB] px-2.5 py-0.5 text-xs font-medium text-[#586380]">
              📚 {total} thẻ
            </span>
          )}
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#23B26D]">
            🌱 {newCount} chưa học
          </span>
          <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
            💧 {dueCount} cần ôn
          </span>
        </div>
      </div>
    </div>
  );
}
