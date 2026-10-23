import Link from "next/link";
import { DeleteFolderButton } from "./delete-folder-button";
import { EditFolderButton } from "./edit-folder-button";
import type { Folder } from "@/db/schema";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

/** Server Component — chỉ nút xóa là client. */
export function FolderCard({ folder }: { folder: Folder }) {
  const href = `/folders/${folder.id}`;
  return (
    <div className="glass-card group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-indigo/5 transition-colors group-hover:bg-indigo/10" />

      <Link href={href} className="relative z-10 mb-6 block flex-1">
        <h3 className="flex items-center gap-2 text-xl font-extrabold text-foreground transition-colors group-hover:text-indigo-light">
          <span className="text-2xl transition-transform group-hover:scale-110">📁</span>
          <span className="truncate">{folder.name}</span>
        </h3>
        {folder.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground-muted">{folder.description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-full border border-border/50 bg-surface px-3 py-1 text-xs font-medium text-foreground-dim">
            🗓️ {dateFormatter.format(folder.createdAt)}
          </span>
          {folder.maxCards && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
              📊 Giới hạn: {folder.maxCards} từ
            </span>
          )}
        </div>
      </Link>

      <div className="relative z-10 flex items-center gap-2 border-t border-border/50 pt-4">
        <Link
          href={href}
          className="flex-1 rounded-xl bg-indigo/10 py-2.5 text-center text-sm font-bold text-indigo-light transition-all duration-300 hover:bg-indigo hover:text-white"
        >
          Mở Thư Mục
        </Link>
        <EditFolderButton folder={folder} />
        <DeleteFolderButton folderId={folder.id} />
      </div>
    </div>
  );
}
