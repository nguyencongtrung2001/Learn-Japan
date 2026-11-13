import Link from "next/link";
import { DeleteFolderButton } from "./delete-folder-button";
import type { FolderWithCount } from "@/actions/folder-actions";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

/** Server Component — hiển thị thẻ thư mục theo Quizlet Minimalist style. */
export function FolderCard({ folder }: { folder: FolderWithCount }) {
  const href = `/folders/${folder.id}`;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E4E9] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#D1D5DB] hover:shadow-lg">
      <Link href={href} className="relative z-10 mb-4 block flex-1">
        <h3 className="flex items-center gap-2 text-lg font-bold text-[#1A1D28] transition-colors group-hover:text-[#4255FF] mb-1.5">
          <span className="text-xl transition-transform group-hover:scale-110 shrink-0">📁</span>
          <span className="truncate">{folder.name}</span>
        </h3>

        {folder.description && (
          <p className="mt-1 line-clamp-2 text-xs sm:text-sm leading-relaxed text-[#586380]">
            {folder.description}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {folder.language === "japanese" ? (
            <span className="rounded-lg bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-bold text-red-600">
              🇯🇵 Tiếng Nhật
            </span>
          ) : (
            <span className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-[#4255FF]">
              🇬🇧 Tiếng Anh
            </span>
          )}
          <span className="inline-block rounded-lg bg-[#F6F7FB] border border-[#E2E4E9] px-2 py-0.5 text-[11px] font-medium text-[#586380]">
            {dateFormatter.format(folder.createdAt)}
          </span>
          {folder.maxCards ? (
            <span className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-600">
              {folder.cardCount ?? 0}/{folder.maxCards} từ
            </span>
          ) : (
            <span className="rounded-lg bg-[#F6F7FB] border border-[#E2E4E9] px-2 py-0.5 text-[11px] font-medium text-[#586380]">
              {folder.cardCount ?? 0} thẻ
            </span>
          )}
        </div>
      </Link>

      <div className="relative z-10 flex items-center gap-2 border-t border-[#E2E4E9] pt-3 mt-auto">
        <Link
          href={href}
          className="flex-1 rounded-xl bg-[#4255FF] py-2 text-center text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:bg-[#3344DD] shadow-xs"
        >
          Mở Thư Mục
        </Link>
        <Link
          href={`/folders/${folder.id}?view=minimal`}
          className="rounded-xl border border-[#E2E4E9] bg-white px-3 py-2 text-xs sm:text-sm font-bold text-[#586380] transition-all duration-200 hover:bg-[#EDEFF4] hover:text-[#1A1D28]"
          title="Học Thẻ Flashcard Tối Giản"
        >
          🗂️
        </Link>
        <DeleteFolderButton folderId={folder.id} />
      </div>
    </div>
  );
}
